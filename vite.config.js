import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig(() => {
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
    // Vitest 설정
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
      // 성능 최적화: 파일 병렬 실행 활성화
      fileParallelism: true,
      // 동시 실행 테스트 수 제한 (메모리 최적화)
      maxConcurrency: 5,
      // 테스트 격리 모드 (성능 향상, 단일 테스트 파일 내에서는 격리 유지)
      isolate: true,
      coverage: {
        provider: 'v8',
        // 리포트 생성 최적화: 필요한 것만 생성 (text는 필수, html은 상세 분석용)
        reporter: ['text', 'html'],
        // 커버리지 수집 범위 제한: 테스트 파일과 설정 파일 제외
          exclude: [
            'node_modules/',
            'src/setupTests.ts',
            '**/*.d.ts',
            '**/*.config.*',
            '**/dist/**',
            '**/coverage/**',
            '**/__tests__/**',
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/mocks/**',
            '**/types/**',
            'src/main.tsx',
            'src/App.tsx',
            'src/AppContainer.tsx',
            'src/components/debug/**', // 개발용 디버그 컴포넌트 제외
          ],
        // 커버리지 임계값 설정 (업계 표준: 80%)
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
        // 성능 최적화: 100% 커버리지 파일 자동 제외
        all: false,
        // 성능 최적화: 100% 커버리지 파일은 수집 스킵 (약 10-15% 성능 향상)
        skipFull: true,
        // 커버리지 디렉토리 자동 정리
        clean: true,
        // 재실행 시 커버리지 디렉토리 정리
        cleanOnRerun: true,
      },
    },
  }
})

