import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'
import { inr, imgSrc } from '../../utils'

const EMPTY = {
  name: '', description: '', categoryId: '', imageUrl: '',
  retailPrice: '', wholesalePrice: '', weight: '', stockQty: '', isActive: true,
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null) // product object or {} for new
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    client.get('/api/admin/products').then((r) => setProducts(r.data)).catch((e) => setError(apiError(e)))
    client.get('/api/admin/categories').then((r) => setCategories(r.data)).catch(() => {})
  }

  function openNew() {
    setForm(EMPTY)
    setEditing({})
    setFormError('')
  }

  function openEdit(p) {
    setForm({
      name: p.name, description: p.description || '', categoryId: p.categoryId || '',
      imageUrl: p.imageUrl || '', retailPrice: p.retailPrice, wholesalePrice: p.wholesalePrice || '',
      weight: p.weight || '', stockQty: p.stockQty, isActive: p.isActive,
    })
    setEditing(p)
    setFormError('')
  }

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await client.post('/api/admin/products/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, imageUrl: data.imageUrl }))
    } catch (e) {
      setFormError(apiError(e, 'Image upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setFormError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        imageUrl: form.imageUrl || null,
        retailPrice: form.retailPrice === '' ? null : Number(form.retailPrice),
        wholesalePrice: form.wholesalePrice === '' ? null : Number(form.wholesalePrice),
        weight: form.weight,
        stockQty: form.stockQty === '' ? null : Number(form.stockQty),
        isActive: form.isActive,
      }
      if (editing.id) {
        await client.put(`/api/admin/products/${editing.id}`, payload)
      } else {
        await client.post('/api/admin/products', payload)
      }
      setEditing(null)
      load()
    } catch (e) {
      const fe = e?.response?.data?.errors
      setFormError(fe ? Object.values(fe).join(' ') : apiError(e))
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(p) {
    if (!confirm(`Deactivate "${p.name}"? It will be hidden from the shop.`)) return
    try {
      await client.delete(`/api/admin/products/${p.id}`)
      load()
    } catch (e) { setError(apiError(e)) }
  }

  return (
    <div className="container">
      <div className="between">
        <h1>Products</h1>
        <button onClick={openNew}>+ Add Product</button>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="card table-wrap mt">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Retail</th><th>Wholesale</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="row">
                    <div style={{ width: 36, height: 36, background: '#f1f3f5', borderRadius: 6, overflow: 'hidden',
                         display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.imageUrl ? <img src={imgSrc(p.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥨'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>{p.weight}</div>
                    </div>
                  </div>
                </td>
                <td>{p.categoryName || '—'}</td>
                <td>{inr(p.retailPrice)}</td>
                <td>{p.wholesalePrice ? inr(p.wholesalePrice) : '—'}</td>
                <td>
                  {p.stockQty === 0
                    ? <span className="badge out">Out of stock</span>
                    : <span>{p.stockQty}</span>}
                </td>
                <td>{p.isActive ? <span className="badge in">Active</span> : <span className="badge out">Inactive</span>}</td>
                <td>
                  <div className="row">
                    <button className="ghost small" onClick={() => openEdit(p)}>Edit</button>
                    {p.isActive && <button className="ghost small" style={{ color: 'var(--red)' }} onClick={() => deactivate(p)}>Deactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={7} className="empty">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.id ? 'Edit product' : 'Add product'}</h2>
            {formError && <div className="alert error">{formError}</div>}

            <label>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <label>Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{!c.isActive ? ' (inactive)' : ''}</option>)}
            </select>

            <label>Product image</label>
            <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files[0])} />
            {uploading && <small className="muted">Uploading...</small>}
            {form.imageUrl && (
              <div className="mt"><img src={imgSrc(form.imageUrl)} alt="preview" style={{ height: 80, borderRadius: 8 }} /></div>
            )}

            <div className="row">
              <div style={{ flex: 1 }}>
                <label>Retail price (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.retailPrice}
                       onChange={(e) => setForm({ ...form, retailPrice: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Wholesale price (₹)</label>
                <input type="number" min="0" step="0.01" value={form.wholesalePrice}
                       onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} />
              </div>
            </div>

            <div className="row">
              <div style={{ flex: 1 }}>
                <label>Weight</label>
                <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 50g" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Stock quantity *</label>
                <input type="number" min="0" value={form.stockQty}
                       onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              </div>
            </div>

            <label className="row" style={{ marginTop: 12 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={form.isActive}
                     onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active (visible in shop)</span>
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
