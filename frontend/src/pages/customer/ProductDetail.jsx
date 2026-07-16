import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { inr, imgSrc, productPrice } from '../../utils'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isDealer, dealerMinOrderQty } = useAuth()
  const minQty = isDealer ? dealerMinOrderQty : 1
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(minQty)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    client.get(`/api/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch((e) => setError(apiError(e, 'Product not found.')))
  }, [id])

  // Reset quantity to the minimum once we know the viewer role / min qty.
  useEffect(() => { setQty(minQty) }, [minQty])

  if (error) return <div className="container"><div className="alert error">{error}</div></div>
  if (!product) return <div className="container"><p className="muted">Loading...</p></div>

  const out = !product.inStock
  const maxQty = product.stockQty

  function changeQty(delta) {
    setQty((q) => Math.max(minQty, Math.min(q + delta, maxQty)))
  }

  function handleAdd() {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="container">
      <Link to="/shop" className="muted">← Back to shop</Link>
      <div className="card mt product-detail">
        <div className="detail-grid">
          <div className="detail-img">
            {product.imageUrl
              ? <img src={imgSrc(product.imageUrl)} alt={product.name} />
              : <span className="detail-img-ph">🥨</span>}
          </div>
          <div>
            <h1 style={{ marginTop: 0 }}>{product.name}</h1>
            {product.categoryName && <span className="badge in" style={{ background: '#eef', color: '#345' }}>{product.categoryName}</span>}
            <p className="muted">{product.weight}</p>
            <div className="price" style={{ fontSize: '1.6rem', color: 'var(--brand)', fontWeight: 700 }}>
              {inr(productPrice(product))}
              {isDealer && <span className="muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}> wholesale</span>}
            </div>
            <p>{product.description || 'No description available.'}</p>

            {out ? (
              <span className="badge out" style={{ fontSize: '0.9rem' }}>Out of stock</span>
            ) : (
              <>
                <div className="muted" style={{ fontSize: '0.85rem' }}>{product.stockQty} in stock</div>
                {isDealer && <div className="muted" style={{ fontSize: '0.85rem' }}>Minimum order: {minQty} units</div>}
                <div className="row mt">
                  <button className="secondary small" onClick={() => changeQty(-1)} disabled={qty <= minQty}>−</button>
                  <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                  <button className="secondary small" onClick={() => changeQty(1)} disabled={qty >= maxQty}>+</button>
                </div>
                <div className="row mt">
                  <button onClick={handleAdd}>Add to Cart</button>
                  <button className="secondary" onClick={() => { addItem(product, qty); navigate('/cart') }}>
                    Buy Now
                  </button>
                </div>
                {added && <div className="alert success">Added to cart!</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
