import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 3001,
      strictPort: true,
      open: true,

      proxy: {
        // Google Gemini — text generation
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/gemini/, ''),
        },
        // OpenAI — text and image generation
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/openai/, ''),
        },
        // Anthropic — Claude text generation
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/anthropic/, ''),
        },
        // Together.ai — free FLUX image generation
        '/api/together': {
          target: 'https://api.together.xyz',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/together/, ''),
        },
        // FastAPI backend — Creator Forge ops pipeline
        // All other /api/* calls route to the specified Python backend target
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          timeout: 60000,
          proxyTimeout: 60000,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn(`[Vite proxy] FastAPI backend not running at ${backendTarget}:`, err.message)
            })
          },
        },

      },
    },
  }
})
