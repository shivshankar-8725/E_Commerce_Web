import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProfileMenu from './ProfileMenu'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const toggle = (
    <button
      className="nav-toggle"
      onClick={() => setOpen(o => !o)}
      aria-label="Toggle menu"
      aria-expanded={open}
    >
      {open ? '✕' : '☰'}
    </button>
  )

  // Admin gets the admin navbar
  if (isAdmin) {
    return (
      <nav className="nav nav-admin">
        <div className="nav-inner">
          <Link to="/admin" className="brand" onClick={close}>🛍️ SoluSphere <span className="brand-tag">Admin</span></Link>
          <div className={`nav-links${open ? ' open' : ''}`}>
            <NavLink to="/admin" end onClick={close}>Dashboard</NavLink>
            <NavLink to="/admin/products" onClick={close}>Products</NavLink>
            <NavLink to="/admin/categories" onClick={close}>Categories</NavLink>
            <NavLink to="/admin/orders" onClick={close}>Orders</NavLink>
            <NavLink to="/admin/customers" onClick={close}>Customers</NavLink>
            <NavLink to="/admin/dealers" onClick={close}>Dealers</NavLink>
            <NavLink to="/admin/reports" onClick={close}>Reports</NavLink>
            <NavLink to="/admin/coupons" onClick={close}>Coupons</NavLink>
            <NavLink to="/admin/pincodes" onClick={close}>Delivery Area</NavLink>
          </div>
          <div className="nav-actions">
            <NotificationBell />
            <ProfileMenu />
          </div>
          {toggle}
        </div>
      </nav>
    )
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/shop" className="brand" onClick={close}>🛍️ SoluSphere</Link>
        <div className={`nav-links${open ? ' open' : ''}`}>
          <NavLink to="/shop" onClick={close}>Shop</NavLink>
          <NavLink to="/cart" className="nav-cart" onClick={close}>
            🛒 Cart{count > 0 && <span className="cart-badge">{count}</span>}
          </NavLink>
          {isAuthenticated ? (
            <NavLink to="/orders" onClick={close}>My Orders</NavLink>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <NavLink to="/register" className="nav-primary" onClick={close}>Register</NavLink>
            </>
          )}
        </div>
        {isAuthenticated && (
          <div className="nav-actions">
            <NotificationBell />
            <ProfileMenu />
          </div>
        )}
        {toggle}
      </div>
    </nav>
  )
}
