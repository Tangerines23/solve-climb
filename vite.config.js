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
      // manualChunks를 제거하여 Vite 기본 번들링 전략(안정성 우선)으로 전환합니다.
      // 특정 패키지 분할이 모듈 초기화 순서를 꼬이게 할 수 있습니다.
    },
    chunkSizeWarningLimit: 2000, // 2MB (TDS 포함 시 용량 증가 대응)
  },
  // optimizeDeps 설정을 최적화하여 CJS/ESM 호환성 이슈를 해결합니다.
  optimizeDeps: {
    include: [
      'hoist-non-react-statics',
      'react-is',
      '@toss/tds-mobile',
      '@toss/tds-mobile-ait'
    ],
  },
})
