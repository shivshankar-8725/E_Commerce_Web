import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { inr, loadRazorpay } from '../../utils'

const EMPTY = { line1: '', city: '', pincode: '', phone: '' }

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { onlinePaymentEnabled, deliveryCharge, freeDeliveryAbove } = useAuth()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [pincodeMsg, setPincodeMsg] = useState(null) // { ok, text }
  const [paymentMode, setPaymentMode] = useState('COD')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [placing, setPlacing] = useState(false)

  // P4-OFFER-01: coupon
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null) // { code, discountAmount, netTotal }
  const [couponError, setCouponError] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    loadAddresses()
  }, [])

  function loadAddresses() {
    client.get('/api/addresses').then((r) => {
      setAddresses(r.data)
      if (r.data.length > 0) {
        setSelectedId(r.data[0].id)
        setShowNew(false)
      } else {
        setShowNew(true)
      }
    }).catch((e) => setError(apiError(e)))
  }

  // Live pincode check (P1-CUST-05)
  function checkPincode(pin) {
    if (!/^\d{6}$/.test(pin)) { setPincodeMsg(null); return }
    client.get(`/api/pincodes/check/${pin}`).then((r) => {
      setPincodeMsg({ ok: r.data.allowed, text: r.data.message })
    }).catch(() => setPincodeMsg(null))
  }

  async function saveAddress() {
    setError('')
    try {
      const { data } = await client.post('/api/addresses', form)
      setForm(EMPTY)
      setShowNew(false)
      setAddresses((prev) => [data, ...prev])
      setSelectedId(data.id)
    } catch (e) {
      const fe = e?.response?.data?.errors
      setError(fe ? Object.values(fe).join(' ') : apiError(e))
    }
  }

  function buildItems() {
    return items.map((i) => ({ productId: i.id, quantity: i.quantity }))
  }

  async function applyCoupon() {
    setCouponError('')
    if (!couponInput.trim()) { setCouponError('Enter a coupon code.'); return }
    setApplying(true)
    try {
      const { data } = await client.post('/api/coupons/apply', {
        code: couponInput.trim(), items: buildItems(),
      })
      setCoupon({ code: data.code, discountAmount: data.discountAmount, netTotal: data.netTotal })
    } catch (e) {
      setCoupon(null)
      setCouponError(apiError(e, 'Coupon could not be applied.'))
    } finally {
      setApplying(false)
    }
  }

  function removeCoupon() {
    setCoupon(null); setCouponInput(''); setCouponError('')
  }

  const goodsNet = coupon ? coupon.netTotal : total
  const delivery = goodsNet < freeDeliveryAbove ? deliveryCharge : 0
  const payable = goodsNet + delivery

  // P1-CUST-06: COD order placed directly.
  async function placeCodOrder() {
    setError(''); setInfo(''); setPlacing(true)
    try {
      const { data } = await client.post('/api/orders', {
        addressId: selectedId, paymentMode: 'COD', items: buildItems(),
        couponCode: coupon?.code || null,
      })
      clearCart()
      navigate(`/orders/${data.id}`, { state: { justPlaced: true } })
    } catch (e) {
      setError(apiError(e, 'Could not place order.'))
    } finally {
      setPlacing(false)
    }
  }

  // P3-PAY-02: ONLINE order — pay first, order is placed only after verification.
  async function payOnline() {
    setError(''); setInfo(''); setPlacing(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) { setError('Could not load the payment gateway. Check your connection.'); setPlacing(false); return }

      // Step 1: create the Razorpay order on the backend (no order placed yet).
      const { data: pay } = await client.post('/api/payments/create-order', {
        addressId: selectedId, paymentMode: 'ONLINE', items: buildItems(),
        couponCode: coupon?.code || null,
      })

      const options = {
        key: pay.keyId,
        amount: pay.amount,
        currency: pay.currency,
        name: pay.name,
        description: pay.description,
        order_id: pay.razorpayOrderId,
        prefill: pay.prefill || {},
        theme: { color: '#e8590c' },
        handler: async (response) => {
          // Step 2: verify on the backend; only then is the order placed + marked PAID.
          try {
            const { data: order } = await client.post('/api/payments/verify', {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            })
            clearCart()
            navigate(`/orders/${order.id}`, { state: { justPlaced: true } })
          } catch (e) {
            setError(apiError(e, 'Payment could not be verified. You have not been charged for an order.'))
            setPlacing(false)
          }
        },
        modal: {
          ondismiss: () => {
            // Customer closed the gateway: no order placed.
            client.post('/api/payments/failed', { razorpayOrderId: pay.razorpayOrderId }).catch(() => {})
            setInfo('Payment cancelled. Your order was not placed.')
            setPlacing(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        client.post('/api/payments/failed', { razorpayOrderId: pay.razorpayOrderId }).catch(() => {})
        setError('Payment failed: ' + (resp?.error?.description || 'please try again') + '. No order was placed.')
        setPlacing(false)
      })
      rzp.open()
    } catch (e) {
      setError(apiError(e, 'Could not start the payment.'))
      setPlacing(false)
    }
  }

  function handlePlace() {
    if (!selectedId) { setError('Please select or add a delivery address.'); return }
    if (paymentMode === 'ONLINE') payOnline()
    else placeCodOrder()
  }

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty"><p>Your cart is empty.</p>
          <button onClick={() => navigate('/shop')}>Browse solutions</button></div>
      </div>
    )
  }

  const selectedAddr = addresses.find((a) => a.id === selectedId)

  return (
    <div className="container">
      <h1>Checkout</h1>
      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert info">{info}</div>}

      <div className="checkout-grid">
        <div className="checkout-col">
      {/* Delivery address */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Delivery address</h2>

        {addresses.length > 0 && !showNew && (
          <>
            {addresses.map((a) => (
              <label key={a.id} className="row" style={{ alignItems: 'flex-start', cursor: 'pointer', padding: '6px 0' }}>
                <input type="radio" name="addr" style={{ width: 'auto' }}
                       checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} />
                <span>
                  <strong>{a.line1}</strong>, {a.city} — {a.pincode}<br />
                  <span className="muted">📞 {a.phone}</span>
                </span>
              </label>
            ))}
            <button className="secondary small mt" onClick={() => setShowNew(true)}>+ Add new address</button>
          </>
        )}

        {showNew && (
          <div>
            <label>Address line</label>
            <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })}
                   placeholder="House no, street, area" />
            <label>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
            <label>Pincode</label>
            <input value={form.pincode} maxLength={6} inputMode="numeric"
                   onChange={(e) => { const v = e.target.value; setForm({ ...form, pincode: v }); checkPincode(v) }}
                   placeholder="6-digit pincode" />
            {pincodeMsg && (
              <div className={`alert ${pincodeMsg.ok ? 'success' : 'error'}`} style={{ marginTop: 6 }}>
                {pincodeMsg.text}
              </div>
            )}
            <label>Phone</label>
            <input value={form.phone} maxLength={10} inputMode="numeric"
                   onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit phone" />
            <div className="row mt">
              <button onClick={saveAddress}>Save address</button>
              {addresses.length > 0 && <button className="secondary" onClick={() => setShowNew(false)}>Cancel</button>}
            </div>
          </div>
        )}
      </div>

      {/* Payment method (P3-PAY-01) */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Payment method</h2>
        <label className="row" style={{ cursor: 'pointer', padding: '6px 0' }}>
          <input type="radio" name="pay" style={{ width: 'auto' }}
                 checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} />
          <span><strong>Cash on Delivery</strong> — pay when your order arrives</span>
        </label>
        <label className="row" style={{ cursor: onlinePaymentEnabled ? 'pointer' : 'not-allowed', padding: '6px 0', opacity: onlinePaymentEnabled ? 1 : 0.5 }}>
          <input type="radio" name="pay" style={{ width: 'auto' }} disabled={!onlinePaymentEnabled}
                 checked={paymentMode === 'ONLINE'} onChange={() => setPaymentMode('ONLINE')} />
          <span>
            <strong>Pay Online</strong> — UPI / card / netbanking (Razorpay)
            {!onlinePaymentEnabled && <span className="muted"> · currently unavailable</span>}
          </span>
        </label>
      </div>

        </div>
        <div className="checkout-col">
      {/* Coupon (P4-OFFER-01) */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Have a coupon?</h2>
        {coupon ? (
          <div className="between">
            <span><span className="badge in">{coupon.code}</span> applied — you save {inr(coupon.discountAmount)}</span>
            <button className="ghost small" onClick={removeCoupon}>Remove</button>
          </div>
        ) : (
          <>
            <div className="row">
              <input placeholder="Enter coupon code" value={couponInput}
                     onChange={(e) => setCouponInput(e.target.value.toUpperCase())} style={{ flex: 1 }} />
              <button className="secondary" onClick={applyCoupon} disabled={applying}>
                {applying ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {couponError && <small style={{ color: 'var(--red)' }}>{couponError}</small>}
          </>
        )}
      </div>

      {/* Order summary */}
      <div className="card" style={{ padding: 16 }}>
        <h2>Order summary</h2>
        {items.map((i) => (
          <div className="between" key={i.id} style={{ padding: '4px 0' }}>
            <span>{i.name} × {i.quantity}</span>
            <span>{inr(i.price * i.quantity)}</span>
          </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
        <div className="between"><span className="muted">Subtotal</span><span>{inr(total)}</span></div>
        {coupon && (
          <div className="between" style={{ color: 'var(--green)' }}>
            <span>Discount ({coupon.code})</span><span>− {inr(coupon.discountAmount)}</span>
          </div>
        )}
        <div className="between">
          <span className="muted">Delivery</span>
          {delivery > 0 ? <span>{inr(delivery)}</span> : <span style={{ color: 'var(--green)' }}>FREE</span>}
        </div>
        {delivery > 0 && (
          <small className="muted">Add {inr(freeDeliveryAbove - goodsNet)} more for free delivery.</small>
        )}
        <div className="between mt"><strong>Total payable</strong><strong>{inr(payable)}</strong></div>
        <div className="alert info mt">
          Payment: {paymentMode === 'ONLINE' ? 'Pay Online (Razorpay test mode)' : 'Cash on Delivery (COD)'}
        </div>
        <button style={{ width: '100%', marginTop: 8 }} disabled={placing || !selectedAddr} onClick={handlePlace}>
          {placing
            ? 'Processing...'
            : paymentMode === 'ONLINE' ? `Pay ${inr(payable)} & Place Order` : `Place Order · ${inr(payable)}`}
        </button>
      </div>
        </div>
      </div>
    </div>
  )
}
