import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { inr, imgSrc } from '../../utils'

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart()
  const { isAuthenticated, isDealer, dealerMinOrderQty } = useAuth()
  const navigate = useNavigate()

  const minQty = isDealer ? dealerMinOrderQty : 1
  const belowMin = isDealer ? items.filter((i) => i.quantity < minQty) : []

  function checkout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } })
    } else {
      navigate('/checkout')
    }
  }

  if (items.length === 0) {
    return (
      <div className="container">
        <h1>Your Cart</h1>
        <div className="empty">
          <div className="big">🛒</div>
          <p>Your cart is empty.</p>
          <Link to="/shop"><button>Browse snacks</button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Your Cart</h1>
      {isDealer && (
        <div className="alert info">🏪 Wholesale pricing · minimum {minQty} units per item.</div>
      )}
      <div className="card" style={{ padding: 8 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="row">
                      <div style={{ width: 44, height: 44, background: '#f1f3f5', borderRadius: 8,
                           display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {i.imageUrl ? <img src={imgSrc(i.imageUrl)} alt={i.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥨'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{i.name}</div>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>{i.weight}</div>
                      </div>
                    </div>
                  </td>
                  <td>{inr(i.price)}</td>
                  <td>
                    <div className="row">
                      <button className="secondary small" onClick={() => updateQuantity(i.id, i.quantity - 1)}
                              disabled={i.quantity <= minQty}>−</button>
                      <span style={{ minWidth: 22, textAlign: 'center' }}>{i.quantity}</span>
                      <button className="secondary small" onClick={() => updateQuantity(i.id, i.quantity + 1)}
                              disabled={i.quantity >= i.stockQty}>+</button>
                    </div>
                    {isDealer && i.quantity < minQty && (
                      <small style={{ color: 'var(--red)' }}>Min {minQty}</small>
                    )}
                  </td>
                  <td>{inr(i.price * i.quantity)}</td>
                  <td><button className="ghost" onClick={() => removeItem(i.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cart-checkout">
        <div className="card cart-summary">
          <div className="between"><span className="muted">Total</span>
            <strong style={{ fontSize: '1.4rem' }}>{inr(total)}</strong></div>
          {belowMin.length > 0 && (
            <small style={{ color: 'var(--red)', display: 'block', marginTop: 8 }}>
              Increase quantity to at least {minQty} for: {belowMin.map((i) => i.name).join(', ')}
            </small>
          )}
          <button style={{ width: '100%', marginTop: 12 }} onClick={checkout} disabled={belowMin.length > 0}>
            Proceed to Checkout
          </button>
        </div>
        <Link to="/shop" className="muted">← Continue shopping</Link>
      </div>
    </div>
  )
}
