import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies /api and /uploads to the Spring Boot backend on :8080
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
    },
  },
})
