import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import ConfirmDialog from '../../components/ConfirmDialog'
import { inr, fmtDate, fmtDateOnly, imgSrc, STATUS_LABELS, paymentInfo } from '../../utils'

const FLOW = ['PLACED', 'ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']
// Customer may cancel only before dispatch.
const CANCELLABLE = ['PLACED', 'ACCEPTED', 'PACKED']

function Timeline({ status }) {
  const currentIdx = FLOW.indexOf(status)
  return (
    <div className="timeline">
      {FLOW.map((s, idx) => {
        const done = idx < currentIdx
        const current = idx === currentIdx
        return (
          <div key={s}>
            <div className={`step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
              <div className="dot" />
              <div className="label">{STATUS_LABELS[s]}</div>
            </div>
            {idx < FLOW.length - 1 && <div className={`line ${idx < currentIdx ? 'done' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  function load() {
    client.get(`/api/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError(apiError(e, 'Order not found.')))
  }

  useEffect(() => { load() }, [id])

  async function cancelOrder() {
    setCancelling(true); setError('')
    try {
      const { data } = await client.patch(`/api/orders/${id}/cancel`)
      setOrder(data)
      setConfirmCancel(false)
    } catch (e) {
      setError(apiError(e, 'Could not cancel the order.'))
      setConfirmCancel(false)
    } finally {
      setCancelling(false)
    }
  }

  if (error) return <div className="container"><div className="alert error">{error}</div></div>
  if (!order) return <div className="container"><p className="muted">Loading...</p></div>

  return (
    <div className="container">
      <Link to="/orders" className="muted">← All orders</Link>

      {location.state?.justPlaced && (
        <div className="alert success mt">🎉 Order placed successfully! Order number {order.orderNumber}.</div>
      )}

      <div className="between mt">
        <h1 style={{ margin: 0 }}>{order.orderNumber}</h1>
        <span className={`status ${order.status}`}>{STATUS_LABELS[order.status]}</span>
      </div>
      <p className="muted">Placed on {fmtDate(order.createdAt)}</p>

      {error && <div className="alert error mt">{error}</div>}

      <div className="fill-grid">
      {/* Tracking (P1-CUST-07) */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Track order</h2>
        {order.status === 'REJECTED' ? (
          <div className="alert error">
            <strong>Order rejected.</strong>
            {order.rejectReason && <div>Reason: {order.rejectReason}</div>}
          </div>
        ) : order.status === 'CANCELLED' ? (
          <div className="alert info"><strong>Order cancelled.</strong> You cancelled this order; any stock has been released.</div>
        ) : (
          <Timeline status={order.status} />
        )}

        {order.estimatedDeliveryAt && ['PLACED', 'ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
          <div className="alert success" style={{ marginTop: 4 }}>
            🚚 Estimated delivery by <strong>{fmtDateOnly(order.estimatedDeliveryAt)}</strong> (within 2 days of placing the order).
          </div>
        )}
        {order.status === 'DELIVERED' && (
          <div className="alert success" style={{ marginTop: 4 }}>✅ Delivered.</div>
        )}

        {CANCELLABLE.includes(order.status) && (
          <div className="mt">
            <button className="danger" onClick={() => setConfirmCancel(true)} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel order'}
            </button>
            <div className="muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
              You can cancel until the order is out for delivery.
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Items</h2>
        {order.items.map((it) => (
          <div className="between" key={it.productId} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="row">
              <div style={{ width: 40, height: 40, background: '#f1f3f5', borderRadius: 8,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {it.imageUrl ? <img src={imgSrc(it.imageUrl)} alt={it.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥨'}
              </div>
              <span>{it.productName} × {it.quantity}</span>
            </div>
            <span>{inr(it.lineTotal)}</span>
          </div>
        ))}
        <div className="between mt"><span className="muted">Subtotal</span>
          <span>{inr(Number(order.totalAmount) - Number(order.deliveryCharge || 0) + Number(order.discountAmount || 0))}</span></div>
        {order.discountAmount > 0 && (
          <div className="between" style={{ color: 'var(--green)' }}>
            <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
            <span>− {inr(order.discountAmount)}</span></div>
        )}
        <div className="between">
          <span className="muted">Delivery</span>
          {Number(order.deliveryCharge) > 0
            ? <span>{inr(order.deliveryCharge)}</span>
            : <span style={{ color: 'var(--green)' }}>FREE</span>}
        </div>
        <div className="between mt"><strong>Total</strong><strong>{inr(order.totalAmount)}</strong></div>
        <div className="row mt">
          {(() => { const p = paymentInfo(order); return (
            <span className="badge" style={{ background: p.bg, color: p.color }}>{p.label}</span>
          )})()}
          {order.paymentTxnId && (
            <span className="muted" style={{ fontSize: '0.8rem' }}>Txn: {order.paymentTxnId}</span>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Delivery address</h2>
        <div>{order.address.line1}, {order.address.city} — {order.address.pincode}</div>
        <div className="muted">📞 {order.address.phone}</div>
      </div>
      </div>

      {confirmCancel && (
        <ConfirmDialog
          title="Cancel this order?"
          message="This will cancel your order and release the items. This cannot be undone."
          confirmLabel="Yes, cancel order"
          cancelLabel="Keep order"
          danger
          onConfirm={cancelOrder}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </div>
  )
}
