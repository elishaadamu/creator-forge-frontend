import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    proxy: {
      // Google Gemini — text generation
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/gemini/, ''),
      },
      // Together.ai — free FLUX image generation
      '/api/together': {
        target: 'https://api.together.xyz',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/together/, ''),
      },
      // FastAPI backend — Creator Forge ops pipeline
      // All other /api/* calls route to the local Python backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[Vite proxy] FastAPI backend not running:', err.message)
          })
        },
      },
    },
  },
})
