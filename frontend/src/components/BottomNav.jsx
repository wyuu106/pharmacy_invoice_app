import { NavLink } from "react-router-dom";

function PatientIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0Z" />
    </svg>
  );
}

const items = [
  { to: "/invoice", icon: "￥", label: "請求書" },
  { to: "/patients", icon: <PatientIcon />, label: "患者" },
  { to: "/others", icon: "…", label: "その他" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="メインメニュー">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
