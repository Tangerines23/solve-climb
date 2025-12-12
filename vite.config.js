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
          // toss-vendor 제거: 동적 import로 처리되므로 수동 청크에 포함하지 않음
          'supabase-vendor': ['@supabase/supabase-js'],
          'zustand-vendor': ['zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB로 증가 (현재 1.4MB이므로)
  },
  // optimizeDeps에서 TDS 제외 (개발 서버에서도 번들에 포함되지 않도록)
  optimizeDeps: {
    exclude: ['@toss/tds-mobile', '@toss/tds-mobile-ait'],
  },
})
