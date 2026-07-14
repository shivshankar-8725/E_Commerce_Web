import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import { inr, fmtDate, STATUS_LABELS, paymentInfo } from '../../utils'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/api/orders')
      .then((r) => setOrders(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container"><p className="muted">Loading orders...</p></div>

  return (
    <div className="container">
      <div className="between">
        <h1 style={{ margin: 0 }}>My Orders</h1>
        {orders.length > 0 && <span className="muted">{orders.length} order{orders.length > 1 ? 's' : ''}</span>}
      </div>

      {error && <div className="alert error">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty">
          <div className="big">📦</div>
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop"><button>Start shopping</button></Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const pay = paymentInfo(o)
            return (
              <Link to={`/orders/${o.id}`} key={o.id} className="order-card">
                <div className="order-icon">📦</div>

                <div className="order-main">
                  <div className="order-top">
                    <strong>{o.orderNumber}</strong>
                    <span className={`status ${o.status}`}>{STATUS_LABELS[o.status]}</span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>{fmtDate(o.createdAt)}</div>
                  <div className="order-meta">
                    <span className="chip">{o.items.length} item{o.items.length > 1 ? 's' : ''}</span>
                    <span className="badge" style={{ background: pay.bg, color: pay.color }}>{pay.label}</span>
                  </div>
                </div>

                <div className="order-right">
                  <div className="order-amount">{inr(o.totalAmount)}</div>
                  <span className="order-view">View details →</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
