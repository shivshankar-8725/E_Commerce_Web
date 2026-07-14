import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'
import { inr } from '../../utils'

const EMPTY = {
  code: '', description: '', discountType: 'PERCENT', discountValue: '',
  maxDiscount: '', minOrderAmount: '', validFrom: '', validUntil: '', usageLimit: '', isActive: true,
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [editing, setEditing] = useState(null) // coupon or {} for new
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    client.get('/api/admin/coupons').then((r) => setCoupons(r.data)).catch((e) => setError(apiError(e)))
  }

  function openNew() { setForm(EMPTY); setEditing({}); setFormError('') }

  function openEdit(c) {
    setForm({
      code: c.code, description: c.description || '', discountType: c.discountType,
      discountValue: c.discountValue, maxDiscount: c.maxDiscount ?? '', minOrderAmount: c.minOrderAmount ?? '',
      validFrom: c.validFrom || '', validUntil: c.validUntil || '', usageLimit: c.usageLimit ?? '', isActive: c.isActive,
    })
    setEditing(c); setFormError('')
  }

  async function save() {
    setFormError(''); setSaving(true)
    try {
      const payload = {
        code: form.code, description: form.description,
        discountType: form.discountType,
        discountValue: form.discountValue === '' ? null : Number(form.discountValue),
        maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
        minOrderAmount: form.minOrderAmount === '' ? null : Number(form.minOrderAmount),
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        isActive: form.isActive,
      }
      if (editing.id) await client.put(`/api/admin/coupons/${editing.id}`, payload)
      else await client.post('/api/admin/coupons', payload)
      setEditing(null)
      load()
    } catch (e) {
      const fe = e?.response?.data?.errors
      setFormError(fe ? Object.values(fe).join(' ') : apiError(e))
    } finally { setSaving(false) }
  }

  async function deactivate(c) {
    if (!confirm(`Deactivate coupon ${c.code}?`)) return
    try { await client.delete(`/api/admin/coupons/${c.id}`); load() } catch (e) { setError(apiError(e)) }
  }

  function valueLabel(c) {
    return c.discountType === 'PERCENT'
      ? `${c.discountValue}%${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ''}`
      : inr(c.discountValue)
  }

  return (
    <div className="container">
      <div className="between">
        <h1>Coupons</h1>
        <button onClick={openNew}>+ Add Coupon</button>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="card table-wrap mt">
        <table>
          <thead>
            <tr><th>Code</th><th>Discount</th><th>Min order</th><th>Validity</th><th>Used</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong><div className="muted" style={{ fontSize: '0.8rem' }}>{c.description}</div></td>
                <td>{valueLabel(c)}</td>
                <td>{c.minOrderAmount ? inr(c.minOrderAmount) : '—'}</td>
                <td className="muted" style={{ fontSize: '0.82rem' }}>
                  {c.validFrom || '—'} → {c.validUntil || '—'}
                </td>
                <td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td>{c.isActive ? <span className="badge in">Active</span> : <span className="badge out">Inactive</span>}</td>
                <td>
                  <div className="row">
                    <button className="ghost small" onClick={() => openEdit(c)}>Edit</button>
                    {c.isActive && <button className="ghost small" style={{ color: 'var(--red)' }} onClick={() => deactivate(c)}>Deactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={7} className="empty">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.id ? 'Edit coupon' : 'Add coupon'}</h2>
            {formError && <div className="alert error">{formError}</div>}

            <label>Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                   placeholder="e.g. SAVE10" />

            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                   placeholder="Shown to admin only" />

            <div className="row">
              <div style={{ flex: 1 }}>
                <label>Discount type *</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>{form.discountType === 'PERCENT' ? 'Percent *' : 'Amount (₹) *'}</label>
                <input type="number" min="0" step="0.01" value={form.discountValue}
                       onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
              </div>
            </div>

            <div className="row">
              {form.discountType === 'PERCENT' && (
                <div style={{ flex: 1 }}>
                  <label>Max discount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.maxDiscount}
                         onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="optional cap" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label>Min order amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.minOrderAmount}
                       onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="optional" />
              </div>
            </div>

            <div className="row">
              <div style={{ flex: 1 }}>
                <label>Valid from</label>
                <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Valid until</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>

            <label>Usage limit (total)</label>
            <input type="number" min="1" value={form.usageLimit}
                   onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="optional" />

            <label className="row" style={{ marginTop: 12 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={form.isActive}
                     onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active</span>
            </label>

            <div className="row mt">
              <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
