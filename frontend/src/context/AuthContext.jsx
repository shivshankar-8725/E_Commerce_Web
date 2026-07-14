import { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  // Public config: dealer min order qty, online payment availability, delivery charge rule.
  const [dealerMinOrderQty, setDealerMinOrderQty] = useState(10)
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false)
  const [deliveryCharge, setDeliveryCharge] = useState(50)
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(1000)
  useEffect(() => {
    client.get('/api/config')
      .then((r) => {
        setDealerMinOrderQty(r.data.dealerMinOrderQty ?? 10)
        setOnlinePaymentEnabled(!!r.data.onlinePaymentEnabled)
        setDeliveryCharge(Number(r.data.deliveryCharge ?? 50))
        setFreeDeliveryAbove(Number(r.data.freeDeliveryAbove ?? 1000))
      })
      .catch(() => {})
  }, [])

  function persist(authResponse) {
    const u = {
      userId: authResponse.userId,
      name: authResponse.name,
      mobile: authResponse.mobile,
      role: authResponse.role,
    }
    localStorage.setItem('token', authResponse.token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  async function login(mobile, password) {
    const { data } = await client.post('/api/auth/login', { mobile, password })
    return persist(data)
  }

  async function register(payload) {
    const { data } = await client.post('/api/auth/register', payload)
    return persist(data)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  async function registerDealer(payload) {
    // Returns a message; does NOT log in (dealer awaits approval).
    const { data } = await client.post('/api/auth/register-dealer', payload)
    return data
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isDealer: user?.role === 'DEALER',
    dealerMinOrderQty,
    onlinePaymentEnabled,
    deliveryCharge,
    freeDeliveryAbove,
    login,
    register,
    registerDealer,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
