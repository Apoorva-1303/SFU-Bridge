import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    proxy:{
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      },
      // This handles regular API calls (fetch/axios)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})


