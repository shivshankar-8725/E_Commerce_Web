import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'

export default function AdminPincodes() {
  const [pincodes, setPincodes] = useState([])
  const [form, setForm] = useState({ pincode: '', area: '' })
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  function load() {
    client.get('/api/admin/pincodes').then((r) => setPincodes(r.data)).catch((e) => setError(apiError(e)))
  }

  async function add() {
    setError('')
    if (!/^\d{6}$/.test(form.pincode)) { setError('Pincode must be exactly 6 digits.'); return }
    try {
      await client.post('/api/admin/pincodes', { pincode: form.pincode, area: form.area, isActive: true })
      setForm({ pincode: '', area: '' })
      load()
    } catch (e) { setError(apiError(e)) }
  }

  async function toggle(p) {
    try {
      await client.put(`/api/admin/pincodes/${p.id}`, { pincode: p.pincode, area: p.area, isActive: !p.isActive })
      load()
    } catch (e) { setError(apiError(e)) }
  }

  async function remove(p) {
    if (!confirm(`Remove pincode ${p.pincode} from the delivery list?`)) return
    try {
      await client.delete(`/api/admin/pincodes/${p.id}`)
      load()
    } catch (e) { setError(apiError(e)) }
  }

  return (
    <div className="container">
      <h1>Delivery Area (Pincodes)</h1>
      <p className="muted" style={{ marginTop: -8 }}>Orders are only accepted for active pincodes in this list.</p>
      {error && <div className="alert error">{error}</div>}

      <div className="card" style={{ padding: 16 }}>
        <div className="row">
          <input placeholder="6-digit pincode" maxLength={6} inputMode="numeric" style={{ flex: 1 }}
                 value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          <input placeholder="Area name (optional)" style={{ flex: 2 }}
                 value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          <button onClick={add}>Add</button>
        </div>
      </div>

      <div className="card table-wrap mt">
        <table>
          <thead><tr><th>Pincode</th><th>Area</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {pincodes.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.pincode}</strong></td>
                <td>{p.area || '—'}</td>
                <td>{p.isActive ? <span className="badge in">Active</span> : <span className="badge out">Inactive</span>}</td>
                <td>
                  <div className="row">
                    <button className="ghost small" onClick={() => toggle(p)}>{p.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="ghost small" style={{ color: 'var(--red)' }} onClick={() => remove(p)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {pincodes.length === 0 && <tr><td colSpan={4} className="empty">No pincodes added. Orders will be blocked until you add a delivery area.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
