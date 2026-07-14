import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProfileMenu from './ProfileMenu'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { count } = useCart()

  // Admin gets the admin navbar
  if (isAdmin) {
    return (
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/admin" className="brand">🛒 E-Mart <span className="brand-tag">Admin</span></Link>
          <div className="nav-links">
            <NavLink to="/admin" end>Dashboard</NavLink>
            <NavLink to="/admin/products">Products</NavLink>
            <NavLink to="/admin/categories">Categories</NavLink>
            <NavLink to="/admin/orders">Orders</NavLink>
            <NavLink to="/admin/customers">Customers</NavLink>
            <NavLink to="/admin/dealers">Dealers</NavLink>
            <NavLink to="/admin/reports">Reports</NavLink>
            <NavLink to="/admin/coupons">Coupons</NavLink>
            <NavLink to="/admin/pincodes">Delivery Area</NavLink>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/shop" className="brand">🛒 E-Mart</Link>
        <div className="nav-links">
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/cart" className="nav-cart">
            🛒 Cart{count > 0 && <span className="cart-badge">{count}</span>}
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/orders">My Orders</NavLink>
              <NotificationBell />
              <ProfileMenu />
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register" className="nav-primary">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
