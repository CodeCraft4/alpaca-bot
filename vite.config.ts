import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// The frontend never holds secrets: in dev, /api is proxied to the backend.
// In production, serve the frontend and backend under the same origin (or set VITE_API_URL, URL only).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4555', changeOrigin: true } },
  },
})
