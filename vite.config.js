import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel 환경인지 확인
  const isVercel = process.env.VERCEL === '1';

  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: isVercel ? {
        '@toss/tds-mobile': path.resolve(process.cwd(), './src/mocks/tds-mobile-mock.tsx'),
        '@apps-in-toss/web-framework': path.resolve(process.cwd(), './src/mocks/web-framework-mock.ts'),
      } : {},
    },
    define: {
      'import.meta.env.VITE_IS_VERCEL': JSON.stringify(isVercel),
    },
    server: {
      host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 가능하도록 설정
      port: parseInt(process.env.DEV_PORT || '5173', 10),
      cors: true, // CORS 활성화
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // 디버그 관련 코드를 별도 청크로 분리 (프로덕션 빌드 최적화)
            if (id.includes('DebugPanel') || 
                id.includes('useDebugStore') ||
                id.includes('/debug/')) {
              return 'debug';
            }
          }
        }
      },
      chunkSizeWarningLimit: 2000, // 2MB (TDS 포함 시 용량 증가 대응)
    },
    // optimizeDeps 설정을 최적화하여 CJS/ESM 호환성 이슈를 해결합니다.
    optimizeDeps: {
      include: [
        'hoist-non-react-statics',
        'react-is',
        ...(isVercel ? [] : ['@toss/tds-mobile', '@apps-in-toss/web-framework'])
      ],
    },
  }
})

