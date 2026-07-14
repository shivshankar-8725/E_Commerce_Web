import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Client-side validation mirrors backend rules for instant feedback.
  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Mobile must be exactly 10 digits'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        password: form.password,
      })
      navigate('/shop', { replace: true }) // customers land on the shop
    } catch (err) {
      // surface field errors if backend returned them
      const fieldErrs = err?.response?.data?.errors
      if (fieldErrs) setErrors(fieldErrs)
      setError(apiError(err, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container narrow">
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h1 className="mb">Create your account</h1>
        <p className="muted" style={{ marginTop: -8 }}>Register as a customer to start ordering.</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" />
          {errors.name && <small style={{ color: 'var(--red)' }}>{errors.name}</small>}

          <label>Mobile number</label>
          <input value={form.mobile} onChange={(e) => update('mobile', e.target.value)}
                 placeholder="10-digit mobile" inputMode="numeric" maxLength={10} />
          {errors.mobile && <small style={{ color: 'var(--red)' }}>{errors.mobile}</small>}

          <label>Email (optional)</label>
          <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                 placeholder="At least 6 characters" />
          {errors.password && <small style={{ color: 'var(--red)' }}>{errors.password}</small>}

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p className="muted mt center">
          Already have an account? <Link to="/login" style={{ color: 'var(--brand)' }}>Login</Link>
        </p>
        <p className="muted center" style={{ marginTop: -4 }}>
          Are you a shopkeeper? <Link to="/register-dealer" style={{ color: 'var(--brand)' }}>Register as a Dealer</Link>
        </p>
      </div>
    </div>
  )
}
