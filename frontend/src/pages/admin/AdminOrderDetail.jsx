import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import { inr, fmtDate, fmtDateOnly, STATUS_LABELS, paymentInfo } from '../../utils'

// Next status options the admin can advance to, per current status.
const NEXT = {
  PLACED: [],                       // use Accept/Reject buttons
  ACCEPTED: ['PACKED'],
  PACKED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  REJECTED: [],
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [id])

  function load() {
    client.get(`/api/admin/orders/${id}`).then((r) => setOrder(r.data)).catch((e) => setError(apiError(e)))
  }

  async function act(fn, successMsg) {
    setError(''); setMsg(''); setBusy(true)
    try {
      await fn()
      setMsg(successMsg)
      setRejectMode(false)
      setReason('')
      load()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  const accept = () => act(() => client.patch(`/api/admin/orders/${id}/accept`), 'Order accepted.')
  const setStatus = (status) => act(() => client.patch(`/api/admin/orders/${id}/status`, { status }), `Status updated to ${STATUS_LABELS[status]}.`)
  const reject = () => {
    if (!reason.trim()) { setError('Please enter a rejection reason.'); return }
    act(() => client.patch(`/api/admin/orders/${id}/reject`, { reason: reason.trim() }), 'Order rejected and stock restored.')
  }

  if (error && !order) return <div className="container"><div className="alert error">{error}</div></div>
  if (!order) return <div className="container"><p className="muted">Loading...</p></div>

  const canReject = ['PLACED', 'ACCEPTED', 'PACKED'].includes(order.status)

  return (
    <div className="container">
      <Link to="/admin/orders" className="muted">← All orders</Link>
      <div className="between mt">
        <h1 style={{ margin: 0 }}>
          {order.orderNumber}
          {order.isDealerOrder && <span className="badge in" style={{ marginLeft: 8, background: '#e5dbff', color: '#5f3dc4', fontSize: '0.75rem', verticalAlign: 'middle' }}>Dealer order</span>}
        </h1>
        <span className={`status ${order.status}`}>{STATUS_LABELS[order.status]}</span>
      </div>
      <p className="muted">
        Placed {fmtDate(order.createdAt)}
        {order.estimatedDeliveryAt && !['DELIVERED', 'REJECTED', 'CANCELLED'].includes(order.status) &&
          <> · Est. delivery by <strong>{fmtDateOnly(order.estimatedDeliveryAt)}</strong></>}
      </p>

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <div className="fill-grid">
      {/* Actions (P1-ADMIN-05/06) */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Actions</h2>
        {order.status === 'PLACED' && (
          <div className="row">
            <button onClick={accept} disabled={busy}>Accept order</button>
            <button className="danger" onClick={() => setRejectMode(true)} disabled={busy}>Reject order</button>
          </div>
        )}
        {NEXT[order.status]?.length > 0 && (
          <div className="row">
            {NEXT[order.status].map((s) => (
              <button key={s} onClick={() => setStatus(s)} disabled={busy}>Mark {STATUS_LABELS[s]}</button>
            ))}
            {canReject && order.status !== 'PLACED' && (
              <button className="danger" onClick={() => setRejectMode(true)} disabled={busy}>Reject</button>
            )}
          </div>
        )}
        {['DELIVERED', 'REJECTED'].includes(order.status) && (
          <p className="muted">This order is {STATUS_LABELS[order.status].toLowerCase()}. No further actions.</p>
        )}
        {order.status === 'REJECTED' && order.rejectReason && (
          <div className="alert error">Rejection reason: {order.rejectReason}</div>
        )}

        {rejectMode && (
          <div className="mt">
            <label>Rejection reason (shown to customer)</label>
            <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Out of stock / outside delivery hours" />
            <div className="row mt">
              <button className="danger" onClick={reject} disabled={busy}>Confirm reject</button>
              <button className="secondary" onClick={() => setRejectMode(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Customer + address */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Customer</h2>
        <div>{order.customerName} · {order.customerMobile}</div>
        <div className="muted mt"><strong>Deliver to:</strong> {order.address.line1}, {order.address.city} — {order.address.pincode} · 📞 {order.address.phone}</div>
      </div>

      {/* Items */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Items</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.productId}>
                  <td>{it.productName}</td><td>{it.quantity}</td>
                  <td>{inr(it.priceAtOrder)}</td><td>{inr(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {order.discountAmount > 0 && (
          <div className="between" style={{ color: 'var(--green)' }}>
            <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
            <span>− {inr(order.discountAmount)}</span>
          </div>
        )}
        {Number(order.deliveryCharge) > 0 && (
          <div className="between"><span className="muted">Delivery</span><span>{inr(order.deliveryCharge)}</span></div>
        )}
        <div className="between mt">
          <span>
            {(() => { const p = paymentInfo(order); return (
              <span className="badge" style={{ background: p.bg, color: p.color }}>{p.label}</span>
            )})()}
            {order.paymentTxnId && (
              <span className="muted" style={{ fontSize: '0.8rem', marginLeft: 8 }}>Txn: {order.paymentTxnId}</span>
            )}
          </span>
          <strong style={{ fontSize: '1.1rem' }}>Total: {inr(order.totalAmount)}</strong>
        </div>
      </div>
      </div>
    </div>
  )
}
