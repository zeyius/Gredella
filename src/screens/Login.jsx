import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { S } from '../lib/strings'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError(S.loginError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logogradella.png" alt="Gradella" className="login-logo" />
        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>{S.email}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{S.password}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? S.loggingIn : S.login}
          </button>
        </form>
      </div>
    </div>
  )
}
