import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import { ProtectedRoute, AdminRoute } from './components/RouteGuards'

import Login from './pages/Login'
import Register from './pages/Register'
import DealerRegister from './pages/DealerRegister'

import Shop from './pages/customer/Shop'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import OrderDetail from './pages/customer/OrderDetail'
import Addresses from './pages/customer/Addresses'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminPincodes from './pages/admin/AdminPincodes'
import AdminDealers from './pages/admin/AdminDealers'
import AdminReports from './pages/admin/AdminReports'
import AdminCoupons from './pages/admin/AdminCoupons'

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth()

  // Landing redirect: admin -> dashboard, others -> shop (P1-AUTH-02)
  const home = isAuthenticated && isAdmin ? '/admin' : '/shop'

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-dealer" element={<DealerRegister />} />

        {/* Customer / public */}
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
        <Route path="/admin/dealers" element={<AdminRoute><AdminDealers /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
        <Route path="/admin/pincodes" element={<AdminRoute><AdminPincodes /></AdminRoute>} />

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </>
  )
}
