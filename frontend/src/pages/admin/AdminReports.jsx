import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'
import { inr } from '../../utils'

// Default range: last 30 days (inclusive of today).
function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function AdminReports() {
  const [from, setFrom] = useState(isoDaysAgo(30))
  const [to, setTo] = useState(isoToday())
  const [limit, setLimit] = useState(5)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function run() {
    setError(''); setLoading(true)
    client.get('/api/admin/reports/sales', { params: { from, to, limit } })
      .then((r) => setReport(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }

  // Load once on mount with the default range.
  useEffect(() => { run() }, [])

  const maxQty = report && report.topProducts.length
    ? Math.max(...report.topProducts.map((p) => p.quantitySold))
    : 0

  return (
    <div className="container">
      <h1>Sales Reports</h1>

      <div className="card" style={{ padding: 16 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <div>
            <label style={{ margin: '0 0 4px' }}>From</label>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ margin: '0 0 4px' }}>To</label>
            <input type="date" value={to} min={from} max={isoToday()} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label style={{ margin: '0 0 4px' }}>Top products</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button onClick={run} disabled={loading}>{loading ? 'Loading...' : 'Run report'}</button>
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {report && (
        <>
          <p className="muted">Showing {report.from} → {report.to} (rejected orders excluded).</p>

          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e7f5ff' }}>🧾</div>
              <div>
                <div className="stat-value" style={{ color: '#1971c2' }}>{report.totalOrders}</div>
                <div className="stat-label">Total Orders</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#ebfbee' }}>💰</div>
              <div>
                <div className="stat-value" style={{ color: '#2b8a3e' }}>{inr(report.totalAmount)}</div>
                <div className="stat-label">Total Sales</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff4e6' }}>📈</div>
              <div>
                <div className="stat-value" style={{ color: '#e67700' }}>
                  {inr(report.totalOrders > 0 ? Number(report.totalAmount) / report.totalOrders : 0)}
                </div>
                <div className="stat-label">Avg Order Value</div>
              </div>
            </div>
          </div>

          <h2 className="mt">Top-selling products</h2>
          {report.topProducts.length === 0 ? (
            <div className="empty">No sales in this period.</div>
          ) : (
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Product</th><th>Units sold</th><th>Revenue</th><th>Share</th></tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p, i) => (
                    <tr key={p.productId}>
                      <td>{i + 1}</td>
                      <td>{p.name}</td>
                      <td>{p.quantitySold}</td>
                      <td>{inr(p.revenue)}</td>
                      <td>
                        <div style={{ background: '#f1f3f5', borderRadius: 6, overflow: 'hidden', height: 10, minWidth: 80 }}>
                          <div style={{ width: `${maxQty ? (p.quantitySold / maxQty) * 100 : 0}%`,
                               background: 'var(--brand)', height: '100%' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
