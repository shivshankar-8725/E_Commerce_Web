import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'
import { fmtDate } from '../../utils'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      const params = search.trim() ? { search: search.trim() } : {}
      client.get('/api/admin/customers', { params })
        .then((r) => setCustomers(r.data))
        .catch((e) => setError(apiError(e)))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="container">
      <h1>Customers</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <input placeholder="🔍 Search by name or mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Registered</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.mobile}</td>
                <td>{c.email || '—'}</td>
                <td className="muted">{fmtDate(c.createdAt)}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={4} className="empty">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
