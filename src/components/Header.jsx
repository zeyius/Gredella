import { useAuth } from '../hooks/useAuth.jsx'
import { S, roleLabel } from '../lib/strings'

export default function Header() {
  const { profile, logout } = useAuth()

  return (
    <header className="app-header">
      <img src="/logogradella.png" alt="Gradella" className="header-logo" />
      {profile && (
        <div className="header-user">
          <span className="header-name">{profile.display_name}</span>
          <span className="header-role">{roleLabel(profile.role)}</span>
          <button className="btn-ghost" onClick={logout}>{S.logout}</button>
        </div>
      )}
    </header>
  )
}
