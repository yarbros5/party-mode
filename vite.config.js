import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // basicSsl enables HTTPS in local dev, which is required for getDisplayMedia
  // (screen capture). Your browser will warn about the self-signed cert once —
  // click "Advanced → Proceed" and it won't ask again for this session.
  plugins: [react(), basicSsl()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
