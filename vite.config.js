import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@mysten/dapp-kit',
      '@mysten/sui',
      '@tanstack/react-query',
    ],
  },
  resolve: {
    dedupe: ['@mysten/sui'],
  },
})
