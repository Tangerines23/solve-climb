import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'toss-vendor': ['@toss/tds-mobile', '@toss/tds-mobile-ait'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'zustand-vendor': ['zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB로 증가 (현재 1.4MB이므로)
  },
})
