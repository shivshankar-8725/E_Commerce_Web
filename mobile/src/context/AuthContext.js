import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import client, { setAuthToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on app start.
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const raw = await AsyncStorage.getItem('user')
        if (token && raw) {
          setAuthToken(token)
          setUser(JSON.parse(raw))
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function persist(auth) {
    const u = { userId: auth.userId, name: auth.name, mobile: auth.mobile, role: auth.role }
    setAuthToken(auth.token)
    await AsyncStorage.setItem('token', auth.token)
    await AsyncStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  async function login(mobile, password) {
    const { data } = await client.post('/api/auth/login', { mobile, password })
    if (data.role === 'ADMIN') {
      // The mobile app is for customers/dealers; block admin here.
      throw { response: { data: { message: 'Admin accounts use the web dashboard.' } } }
    }
    return persist(data)
  }

  async function register(payload) {
    const { data } = await client.post('/api/auth/register', payload)
    return persist(data)
  }

  async function logout() {
    setAuthToken(null)
    await AsyncStorage.multiRemove(['token', 'user'])
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
