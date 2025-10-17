import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration documentation
// https://vite.dev/config/

// For modifying the server settings
// https://vite.dev/config/server-options
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})

