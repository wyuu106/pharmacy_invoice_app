import { useNavigate } from 'react-router-dom'
import { clearLogin, getUserName } from '../utils/auth'

export default function OthersPage() {
  const navigate = useNavigate()
  function logout() { clearLogin(); navigate('/login', { replace: true }) }
  return (
    <><header className="page-header"><h1>その他</h1><p>設定やログアウトができます</p></header><section className="settings-card"><div><h2>ログイン中</h2><p>{getUserName()}</p></div><button className="danger" onClick={logout}>ログアウト</button></section></>
  )
}
