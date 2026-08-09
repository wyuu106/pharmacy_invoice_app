import { NavLink } from 'react-router-dom'

const items = [
  { to: '/invoice', icon: '￥', label: '請求書' },
  { to: '/patients', icon: '人', label: '患者' },
  { to: '/others', icon: '…', label: 'その他' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="メインメニュー">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
