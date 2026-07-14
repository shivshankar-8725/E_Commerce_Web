import axios from 'axios'

// Base URL: in production set VITE_API_URL to the backend origin (e.g. the Render
// backend URL). In dev it stays empty so /api/* is proxied to the backend by Vite.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

// Attach JWT from localStorage on every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear the session so the app redirects to login.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Avoid redirect loop on the login/register pages themselves
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Helper to extract a friendly message from an API error.
export function apiError(err, fallback = 'Something went wrong.') {
  return err?.response?.data?.message || fallback
}

export default client
