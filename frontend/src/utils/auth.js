const TOKEN_KEY = 'pharmacy_invoice_token'
const USER_NAME_KEY = 'pharmacy_invoice_user_name'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const getUserName = () => localStorage.getItem(USER_NAME_KEY) || ''
export const isLoggedIn = () => Boolean(getToken())

export function saveLogin(token, name) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_NAME_KEY, name)
}

export function clearLogin() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_NAME_KEY)
}
