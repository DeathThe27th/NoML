import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['@mysten/sui', '@mysten/dapp-kit', 'react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@mysten/dapp-kit', '@mysten/sui', '@tanstack/react-query'],
  },
})
