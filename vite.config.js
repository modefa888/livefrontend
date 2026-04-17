import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        // target: 'http://180.184.79.211:8888',
        changeOrigin: true,
        secure: false
      }
    }
  }
})