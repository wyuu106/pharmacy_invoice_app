import { clearLogin, getToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function api(path, options = {}) {
  const headers = { ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  if (response.status === 401 && token) {
    clearLogin()
    window.location.assign('/login')
    throw new Error('ログインの有効期限が切れました。もう一度ログインしてください')
  }
  if (!response.ok) {
    let message = '処理に失敗しました。もう一度お試しください'
    try {
      const data = await response.json()
      message = typeof data.detail === 'string' ? data.detail : message
    } catch {
      // JSONでないエラーでは共通メッセージを使う
    }
    throw new Error(message)
  }
  return response.status === 204 ? null : response.json()
}
