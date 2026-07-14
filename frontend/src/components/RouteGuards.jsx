import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Requires any logged-in user (P1-SYS-02 — protected customer routes).
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

// Requires ADMIN role (P1-AUTH-03 / P1-SYS-02 — non-admins blocked from admin panel).
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/shop" replace />
  return children
}
