import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'

const EMPTY = { line1: '', city: '', pincode: '', phone: '' }

export default function Addresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // editingId: null = none, 'new' = adding, <number> = editing that address
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState('')
  const [pincodeMsg, setPincodeMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    client.get('/api/addresses')
      .then((r) => setAddresses(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }

  function startAdd() {
    setForm(EMPTY); setEditingId('new'); setFormError(''); setPincodeMsg(null); setMsg('')
  }
  function startEdit(a) {
    setForm({ line1: a.line1, city: a.city, pincode: a.pincode, phone: a.phone })
    setEditingId(a.id); setFormError(''); setPincodeMsg(null); setMsg('')
  }
  function cancel() { setEditingId(null); setForm(EMPTY); setFormError('') }

  function checkPincode(pin) {
    if (!/^\d{6}$/.test(pin)) { setPincodeMsg(null); return }
    client.get(`/api/pincodes/check/${pin}`)
      .then((r) => setPincodeMsg({ ok: r.data.allowed, text: r.data.message }))
      .catch(() => setPincodeMsg(null))
  }

  async function save() {
    setFormError(''); setSaving(true)
    try {
      if (editingId === 'new') {
        await client.post('/api/addresses', form)
        setMsg('Address added.')
      } else {
        await client.put(`/api/addresses/${editingId}`, form)
        setMsg('Address updated.')
      }
      cancel()
      load()
    } catch (e) {
      const fe = e?.response?.data?.errors
      setFormError(fe ? Object.values(fe).join(' ') : apiError(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(a) {
    if (!confirm(`Delete this address?\n${a.line1}, ${a.city} — ${a.pincode}`)) return
    setError(''); setMsg('')
    try {
      await client.delete(`/api/addresses/${a.id}`)
      setMsg('Address deleted.')
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }

  function AddressForm() {
    return (
      <div className="card" style={{ padding: 16, maxWidth: 480 }}>
        <h2 style={{ marginTop: 0 }}>{editingId === 'new' ? 'Add address' : 'Edit address'}</h2>
        {formError && <div className="alert error">{formError}</div>}
        <label>Address line</label>
        <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="House no, street, area" />
        <label>City</label>
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
        <label>Pincode</label>
        <input value={form.pincode} maxLength={6} inputMode="numeric"
               onChange={(e) => { const v = e.target.value; setForm({ ...form, pincode: v }); checkPincode(v) }}
               placeholder="6-digit pincode" />
        {pincodeMsg && (
          <div className={`alert ${pincodeMsg.ok ? 'success' : 'error'}`} style={{ marginTop: 6 }}>{pincodeMsg.text}</div>
        )}
        <label>Phone</label>
        <input value={form.phone} maxLength={10} inputMode="numeric"
               onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit phone" />
        <div className="row mt">
          <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button className="secondary" onClick={cancel}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="between">
        <h1 style={{ margin: 0 }}>My Addresses</h1>
        {editingId === null && <button onClick={startAdd}>+ Add address</button>}
      </div>

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      {editingId !== null && <div className="mt">{AddressForm()}</div>}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : addresses.length === 0 && editingId === null ? (
        <div className="empty">
          <div className="big">📍</div>
          <p>You have no saved addresses yet.</p>
          <button onClick={startAdd}>Add your first address</button>
        </div>
      ) : (
        <div className="fill-grid mt">
          {addresses.map((a) => (
            <div key={a.id} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600 }}>{a.line1}</div>
              <div className="muted">{a.city} — {a.pincode}</div>
              <div className="muted">📞 {a.phone}</div>
              <div className="row mt">
                <button className="secondary small" onClick={() => startEdit(a)}>Edit</button>
                <button className="ghost small" style={{ color: 'var(--red)' }} onClick={() => remove(a)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
