import axios from 'axios'
import { API_BASE_URL } from '../config'

// In-memory JWT, kept in sync with AsyncStorage by AuthContext.
let authToken = null
export function setAuthToken(token) { authToken = token }
export function getAuthToken() { return authToken }

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 })

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check API URL / Wi-Fi.'
  return fallback
}

export default client
