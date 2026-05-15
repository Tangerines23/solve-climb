import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Vercel 환경인지 확인
  const isVercel = process.env.VERCEL === '1';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    base: './',
    plugins: [
      react(),
      // Sentry Source Map Upload (Analysis 모드에서는 제외하여 경고 방지 및 속도 향상)
      !isAnalyze &&
        sentryVitePlugin({
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          authToken: env.SENTRY_AUTH_TOKEN,
        }),
      // Bundle analyzer (only in analyze mode)
      isAnalyze &&
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      // PWA support
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Solve Climb: 수학 정복의 길',
          short_name: 'SolveClimb',
          description: '수학 문제를 풀며 산을 정복하는 두뇌 계발 게임',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: './',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
        ...(isVercel
          ? {
              '@apps-in-toss/web-framework': path.resolve(
                process.cwd(),
                './src/mocks/web-framework-mock.ts'
              ),
            }
          : {}),
      },
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
            if (id.includes('node_modules')) {
              // 자주 변경되지 않는 대형 라이브러리 분리 (캐싱 전략)
              if (id.includes('framer-motion')) return 'vendor-animation';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('react-router')) return 'vendor-router';
              if (id.includes('vitals') || id.includes('sentry')) return 'monitor';
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler'))
                return 'vendor-core';
              if (id.includes('zustand') || id.includes('lodash') || id.includes('date-fns'))
                return 'vendor-utils';
              return 'vendor';
            }
            // 기능 도메인별 분리 (Feature-based code splitting)
            if (id.includes('/features/quiz/')) return 'feat-quiz';
            if (id.includes('/features/mypage/')) return 'feat-mypage';
            if (id.includes('/features/debug/') || id.includes('/debug/')) return 'feat-debug';

            // 공통 컴포넌트 분리
            if (id.includes('/components/common/')) return 'shared-ui';
          },
        },
      },
      chunkSizeWarningLimit: 2000, // 2MB (TDS 포함 시 용량 증가 대응)
    },
    // optimizeDeps 설정을 최적화하여 CJS/ESM 호환성 이슈를 해결합니다.
    optimizeDeps: {
      include: ['hoist-non-react-statics', 'react-is'],
    },
    // Vitest base 설정
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
      exclude: [
        'node_modules/**',
        'dist/**',
        'cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        'tests/e2e/**',
        '**/*.spec.{ts,tsx}',
        '**/*.ct.spec.tsx',
      ],
      fileParallelism: true,
      maxConcurrency: 3,
      testTimeout: 15000,
      isolate: true,
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'json-summary', 'lcov', 'html'],
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
          'src/componnets/debug/**',
        ],
        thresholds: {
          statements: 70,
          branches: 55,
          functions: 65,
          lines: 70,
          'src/pages/QuizPage.tsx': {
            statements: 80,
            branches: 45,
            functions: 70,
            lines: 80,
          },
          'src/stores/useUserStore.ts': {
            statements: 90,
            branches: 75,
            functions: 85,
            lines: 90,
          },
        },
        all: true,
        clean: true,
        reportsDirectory: './coverage',
      },
      outputFile: './reports/test-results.xml',
      reporters: ['default', 'junit'],
    },
  };
});
