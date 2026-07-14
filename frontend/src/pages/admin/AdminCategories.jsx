import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  function load() {
    client.get('/api/admin/categories').then((r) => setCategories(r.data)).catch((e) => setError(apiError(e)))
  }

  async function add() {
    setError('')
    if (!name.trim()) { setError('Category name is required.'); return }
    try {
      await client.post('/api/admin/categories', { name: name.trim(), isActive: true })
      setName('')
      load()
    } catch (e) { setError(apiError(e)) }
  }

  async function saveEdit(c) {
    try {
      await client.put(`/api/admin/categories/${c.id}`, { name: editName.trim(), isActive: c.isActive })
      setEditing(null)
      load()
    } catch (e) { setError(apiError(e)) }
  }

  async function toggleActive(c) {
    try {
      if (c.isActive) {
        await client.delete(`/api/admin/categories/${c.id}`) // deactivate
      } else {
        await client.put(`/api/admin/categories/${c.id}`, { name: c.name, isActive: true })
      }
      load()
    } catch (e) { setError(apiError(e)) }
  }

  return (
    <div className="container">
      <h1>Categories</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="card" style={{ padding: 16 }}>
        <div className="row">
          <input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && add()} style={{ flex: 1 }} />
          <button onClick={add}>Add</button>
        </div>
      </div>

      <div className="card table-wrap mt">
        <table>
          <thead><tr><th>Name</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {editing === c.id
                    ? <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    : c.name}
                </td>
                <td>{c.isActive ? <span className="badge in">Active</span> : <span className="badge out">Inactive</span>}</td>
                <td>
                  <div className="row">
                    {editing === c.id ? (
                      <>
                        <button className="small" onClick={() => saveEdit(c)}>Save</button>
                        <button className="secondary small" onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="ghost small" onClick={() => { setEditing(c.id); setEditName(c.name) }}>Edit</button>
                        <button className="ghost small" onClick={() => toggleActive(c)}>
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={3} className="empty">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
