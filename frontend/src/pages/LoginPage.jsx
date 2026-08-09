import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Message from '../components/Message'
import { api } from '../utils/api'
import { saveLogin } from '../utils/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ user_id: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/login', { method: 'POST', body: JSON.stringify(form) })
      saveLogin(data.access_token, data.name)
      navigate('/invoice', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">＋</div>
        <h1>請求書作成</h1>
        <p className="lead">IDとパスワードを入力してください</p>
        <Message>{error}</Message>
        <form onSubmit={handleSubmit}>
          <label>ID<input autoFocus autoComplete="username" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required /></label>
          <label>パスワード<input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <button className="primary full" disabled={loading}>{loading ? '確認しています…' : 'ログイン'}</button>
        </form>
      </section>
    </main>
  )
}
