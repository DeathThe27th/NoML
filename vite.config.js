import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      '@mysten/dapp-kit',
      '@mysten/sui',
      '@mysten/sui/transactions',
      '@mysten/sui/client',
      '@tanstack/react-query',
    ],
    force: true,
  },
  resolve: {
    dedupe: ['@mysten/sui', '@mysten/dapp-kit'],
  },
})
