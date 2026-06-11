import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // In local dev, proxy /api calls to a local Express server or Vercel dev CLI.
    // When deployed to Vercel, /api routes are handled by the serverless functions in /api/.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
