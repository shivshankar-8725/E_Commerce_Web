import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { inr, fmtDate, STATUS_LABELS } from '../../utils'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [pendingDealers, setPendingDealers] = useState(0)
  const [outOfStock, setOutOfStock] = useState(0)
  const [customers, setCustomers] = useState(0)

  useEffect(() => {
    client.get('/api/admin/dashboard/summary').then((r) => setSummary(r.data)).catch(() => {})
    client.get('/api/admin/orders').then((r) => setOrders(r.data)).catch(() => {})
    client.get('/api/admin/dealers', { params: { status: 'PENDING' } }).then((r) => setPendingDealers(r.data.length)).catch(() => {})
    client.get('/api/admin/products').then((r) => setOutOfStock(r.data.filter((p) => p.isActive && p.stockQty === 0).length)).catch(() => {})
    client.get('/api/admin/customers').then((r) => setCustomers(r.data.length)).catch(() => {})
  }, [])

  const newOrders = orders.filter((o) => o.status === 'PLACED').length
  const recent = orders.slice(0, 6)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const stats = [
    { label: "Today's Orders", value: summary ? summary.todayOrderCount : '—', icon: '🧾', color: '#1971c2', bg: '#e7f5ff', to: '/admin/orders' },
    { label: "Today's Sales", value: summary ? inr(summary.todayTotalAmount) : '—', icon: '💰', color: '#2b8a3e', bg: '#ebfbee', to: '/admin/reports' },
    { label: 'New Orders', value: newOrders, icon: '🆕', color: '#e67700', bg: '#fff4e6', to: '/admin/orders' },
    { label: 'Pending Dealers', value: pendingDealers, icon: '🏪', color: '#5f3dc4', bg: '#f3f0ff', to: '/admin/dealers' },
    { label: 'Out of Stock', value: outOfStock, icon: '📦', color: '#c92a2a', bg: '#fff5f5', to: '/admin/products' },
    { label: 'Customers', value: customers, icon: '👥', color: '#0c8599', bg: '#e3fafc', to: '/admin/customers' },
  ]

  const actions = [
    { label: 'Add / Manage Products', icon: '🛒', to: '/admin/products' },
    { label: 'Categories', icon: '🗂️', to: '/admin/categories' },
    { label: 'Coupons', icon: '🏷️', to: '/admin/coupons' },
    { label: 'Sales Reports', icon: '📊', to: '/admin/reports' },
    { label: 'Delivery Area', icon: '📍', to: '/admin/pincodes' },
    { label: 'Dealers', icon: '🤝', to: '/admin/dealers' },
  ]

  return (
    <div className="container">
      <div className="dash-hero">
        <div>
          <h1 className="dash-hello">Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋</h1>
          <p className="dash-date">{today}</p>
        </div>
        <Link to="/admin/orders" className="dash-hero-btn">View Orders →</Link>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <Link to={s.to} key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="dash-cols">
        <div className="card dash-panel">
          <div className="between">
            <h2 style={{ margin: 0 }}>Recent orders</h2>
            <Link to="/admin/orders" className="muted" style={{ fontSize: '0.85rem' }}>See all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty">No orders yet.</div>
          ) : (
            <div style={{ marginTop: 10 }}>
              {recent.map((o) => (
                <Link to={`/admin/orders/${o.id}`} key={o.id} className="dash-order">
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.orderNumber}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{o.customerName} · {fmtDate(o.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{inr(o.totalAmount)}</div>
                    <span className={`status ${o.status}`}>{STATUS_LABELS[o.status]}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card dash-panel">
          <h2 style={{ marginTop: 0 }}>Quick actions</h2>
          <div className="qa-grid">
            {actions.map((a) => (
              <Link to={a.to} key={a.label} className="qa-card">
                <span className="qa-icon">{a.icon}</span>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
