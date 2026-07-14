import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client, { apiError } from '../../api/client'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { inr, imgSrc, productPrice } from '../../utils'

export default function Shop() {
  const { addItem } = useCart()
  const { isDealer, dealerMinOrderQty } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/api/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  // Reload products when filters change (debounced for search).
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      const params = {}
      if (categoryId) params.categoryId = categoryId
      if (search.trim()) params.search = search.trim()
      client.get('/api/products', { params })
        .then((r) => setProducts(r.data))
        .catch((e) => setError(apiError(e)))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [categoryId, search])

  return (
    <div className="container">
      {/* Welcome banner */}
      <div className="shop-hero">
        <div>
          <h1 className="shop-hero-title">Products</h1>
          <p className="shop-hero-sub">Browse our products and add your favourites to the cart.</p>
        </div>
        <div className="shop-hero-emoji">🛒</div>
      </div>

      {isDealer && (
        <div className="alert info">
          🏪 Dealer account — showing <strong>wholesale prices</strong>. Minimum {dealerMinOrderQty} units per item.
        </div>
      )}

      {/* Search + category chips */}
      <div className="card shop-toolbar">
        <input
          className="shop-search"
          placeholder="🔍 Search snacks by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="cat-chips">
          <button className={`chip-btn ${!categoryId ? 'active' : ''}`} onClick={() => setCategoryId('')}>All</button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip-btn ${String(categoryId) === String(c.id) ? 'active' : ''}`}
              onClick={() => setCategoryId(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p className="muted">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="empty">
          <div className="big">🛒</div>
          <p>No products found{search ? ` for "${search}"` : ''}. Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => {
            const out = !p.inStock
            return (
              <div className={`card product-card ${out ? 'is-out' : ''}`} key={p.id}>
                <Link to={`/product/${p.id}`} className="img">
                  {p.imageUrl
                    ? <img src={imgSrc(p.imageUrl)} alt={p.name} />
                    : <span className="placeholder">🥨</span>}
                  {out && <span className="img-ribbon">Out of stock</span>}
                </Link>
                <div className="body">
                  {p.categoryName && <span className="card-cat">{p.categoryName}</span>}
                  <Link to={`/product/${p.id}`} className="name">{p.name}</Link>
                  <div className="weight">{p.weight}</div>
                  <div className="price">
                    {inr(productPrice(p))}
                    {isDealer && <span className="muted" style={{ fontSize: '0.72rem', fontWeight: 400 }}> wholesale</span>}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                    {out ? (
                      <button className="small" style={{ width: '100%' }} disabled>Out of stock</button>
                    ) : (
                      <button className="small add-btn" style={{ width: '100%' }}
                              onClick={() => addItem(p, isDealer ? dealerMinOrderQty : 1)}>
                        🛒 Add to Cart{isDealer ? ` (${dealerMinOrderQty})` : ''}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
