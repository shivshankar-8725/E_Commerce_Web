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
    <div className="container narrow">
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h1 className="mb">Login</h1>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Mobile number</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)}
                 placeholder="10-digit mobile" inputMode="numeric" />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 placeholder="Your password" />
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="muted mt center">
          New here? <Link to="/register" style={{ color: 'var(--brand)' }}>Create an account</Link>
          {' '}· <Link to="/register-dealer" style={{ color: 'var(--brand)' }}>Dealer signup</Link>
        </p>
      </div>
    </div>
  )
}
