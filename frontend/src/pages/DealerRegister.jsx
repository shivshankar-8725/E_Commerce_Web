import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'

export default function DealerRegister() {
  const { registerDealer } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', password: '', shopName: '', contactPerson: '', gstNumber: '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Mobile must be exactly 10 digits'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (!form.shopName.trim()) e.shopName = 'Shop name is required'
    if (form.gstNumber && !/^[0-9A-Z]{15}$/.test(form.gstNumber)) e.gstNumber = 'GST must be 15 characters (A-Z, 0-9)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError(''); setSuccess('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await registerDealer({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        password: form.password,
        shopName: form.shopName.trim(),
        contactPerson: form.contactPerson.trim() || null,
        gstNumber: form.gstNumber.trim().toUpperCase() || null,
      })
      setSuccess(res.message || 'Registration received. Your dealer account is pending admin approval.')
    } catch (err) {
      const fieldErrs = err?.response?.data?.errors
      if (fieldErrs) setErrors(fieldErrs)
      setError(apiError(err, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container narrow">
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <div className="big center" style={{ fontSize: '2.5rem' }}>⏳</div>
          <h1 className="center">Application submitted</h1>
          <div className="alert success">{success}</div>
          <p className="muted center">You'll be able to log in and see wholesale prices once an admin approves your account.</p>
          <button style={{ width: '100%' }} onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container narrow">
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h1 className="mb">Register as a Dealer</h1>
        <p className="muted" style={{ marginTop: -8 }}>Wholesale pricing & bulk ordering. Requires admin approval.</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Your name *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" />
          {errors.name && <small style={{ color: 'var(--red)' }}>{errors.name}</small>}

          <label>Shop / Business name *</label>
          <input value={form.shopName} onChange={(e) => update('shopName', e.target.value)} placeholder="e.g. Sharma Kirana Store" />
          {errors.shopName && <small style={{ color: 'var(--red)' }}>{errors.shopName}</small>}

          <label>Contact person (optional)</label>
          <input value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} placeholder="Defaults to your name" />

          <label>GST number (optional)</label>
          <input value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value.toUpperCase())}
                 placeholder="15-character GSTIN" maxLength={15} />
          {errors.gstNumber && <small style={{ color: 'var(--red)' }}>{errors.gstNumber}</small>}

          <label>Mobile number *</label>
          <input value={form.mobile} onChange={(e) => update('mobile', e.target.value)}
                 placeholder="10-digit mobile" inputMode="numeric" maxLength={10} />
          {errors.mobile && <small style={{ color: 'var(--red)' }}>{errors.mobile}</small>}

          <label>Email (optional)</label>
          <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />

          <label>Password *</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                 placeholder="At least 6 characters" />
          {errors.password && <small style={{ color: 'var(--red)' }}>{errors.password}</small>}

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
            {loading ? 'Submitting...' : 'Submit dealer application'}
          </button>
        </form>
        <p className="muted mt center">
          Ordinary customer? <Link to="/register" style={{ color: 'var(--brand)' }}>Register here</Link> ·{' '}
          <Link to="/login" style={{ color: 'var(--brand)' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}
