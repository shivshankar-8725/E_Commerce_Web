import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import { inr, fmtDate, STATUS_LABELS, paymentInfo } from '../../utils'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/api/admin/orders').then((r) => setOrders(r.data)).catch((e) => setError(apiError(e)))
  }, [])

  const shown = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="container">
      <div className="between">
        <h1>Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="ALL">All</option>
          {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="card table-wrap mt">
        <table>
          <thead>
            <tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}
                  style={{ cursor: 'pointer', background: o.status === 'PLACED' ? '#fff9db' : undefined }}>
                <td>
                  <strong>{o.orderNumber}</strong>
                  {o.status === 'PLACED' && <span className="badge in" style={{ marginLeft: 6, background: '#ffec99', color: '#e67700' }}>NEW</span>}
                  {o.isDealerOrder && <span className="badge in" style={{ marginLeft: 6, background: '#e5dbff', color: '#5f3dc4' }}>Dealer order</span>}
                </td>
                <td className="muted">{fmtDate(o.createdAt)}</td>
                <td>{o.customerName}<br /><span className="muted" style={{ fontSize: '0.8rem' }}>{o.customerMobile}</span></td>
                <td>{o.items.length}</td>
                <td>{inr(o.totalAmount)}</td>
                <td>
                  {(() => { const p = paymentInfo(o); return (
                    <span className="badge" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                  )})()}
                </td>
                <td><span className={`status ${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} className="empty">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
