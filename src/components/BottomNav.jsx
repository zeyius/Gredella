import { NavLink } from 'react-router-dom'
import { S } from '../lib/strings'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">📅</span>
        <span>{S.navCalendar}</span>
      </NavLink>
      <NavLink to="/stock" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">👗</span>
        <span>{S.navStock}</span>
      </NavLink>
      <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">👥</span>
        <span>{S.navCustomers}</span>
      </NavLink>
    </nav>
  )
}
