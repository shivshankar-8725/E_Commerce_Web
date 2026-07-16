import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(mobile.trim(), password)
      // Redirect by role (P1-AUTH-02)
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        const dest = location.state?.from && location.state.from !== '/login'
          ? location.state.from : '/shop'
        navigate(dest, { replace: true })
      }
    } catch (err) {
      setError(apiError(err, 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container narrow" style={{ paddingTop: 60 }}>
      <div className="auth-card">
        <div className="auth-logo">🛍️</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your SoluSphere account</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-mobile">Mobile number</label>
          <input
            id="login-mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile"
            inputMode="numeric"
            autoComplete="tel"
          />
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 20, padding: '13px 20px', fontSize: '1rem' }}
          >
            {loading ? 'Signing in...' : '✦ Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          New here?{' '}
          <Link to="/register">Create an account</Link>
          {' '}·{' '}
          <Link to="/register-dealer">Dealer signup</Link>
        </div>
      </div>
    </div>
  )
}
