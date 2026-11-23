import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import dns from 'node:dns'
import https from 'node:https'

dns.setDefaultResultOrder('ipv4first')

const agent = new https.Agent({
  keepAlive: true,
  family: 4,
  rejectUnauthorized: false,
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  const target = env.VITE_PROXY_TARGET || 'https://depi-e-commerce.runasp.net'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    build: {
      target: 'esnext',
    },
    server: {
      port: 5173,
      watch: {
        ignored: ['**/.vs/**', /[\\/]\.vs[\\/]/],
      },
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          agent,
          timeout: 30000,
          proxyTimeout: 30000,
        },
        '/hubs': {
          target,
          changeOrigin: true,
          secure: false,
          agent,
          ws: true,
        },
      },
    },
  }
})