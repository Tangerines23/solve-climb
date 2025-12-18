import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 가능하도록 설정
    port: parseInt(process.env.DEV_PORT || '5173', 10),
    cors: true, // CORS 활성화
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // node_modules의 패키지들을 별도 청크로 분리
          if (id.includes('node_modules')) {
            // React 관련 패키지
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Supabase 관련 패키지
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Zustand 상태관리
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }
            // Toss 관련 패키지 (동적 import되지만 별도 청크로 분리)
            if (id.includes('@apps-in-toss') || id.includes('@toss')) {
              return 'vendor-toss';
            }
            // 기타 vendor 패키지들
            return 'vendor-other';
          }
          
          // src/utils 폴더의 파일들을 별도 청크로 분리 (큰 파일들)
          if (id.includes('src/utils/')) {
            // 토스 관련 유틸리티
            if (id.includes('tossAuth') || id.includes('tossLogin') || id.includes('tossGameLogin') || id.includes('tossGameCenter')) {
              return 'utils-toss';
            }
            // 기타 유틸리티
            return 'utils-common';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB
  },
  // optimizeDeps에서 TDS 제외 (개발 서버에서도 번들에 포함되지 않도록)
  optimizeDeps: {
    exclude: ['@toss/tds-mobile', '@toss/tds-mobile-ait'],
    esbuildOptions: {
      // hoist-non-react-statics를 CommonJS로 처리
      mainFields: ['module', 'main'],
    },
  },
})
