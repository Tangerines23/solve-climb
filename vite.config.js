import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'child_process';
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

  const getGitPRNumber = () => {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      const prMatch = branch.match(/pr[-_/](\d+)/i);
      return prMatch ? prMatch[1] : '0';
    } catch (e) {
      return '0';
    }
  };

  const getGitCommitCount = () => {
    try {
      return execSync('git rev-list --count HEAD').toString().trim();
    } catch (e) {
      return '0';
    }
  };

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
        registerType: 'prompt',
        manifest: {
          name: 'Solve Climb',
          short_name: 'Climb',
          theme_color: '#ffffff',
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
      'import.meta.env.VITE_PR_NUMBER': JSON.stringify(
        process.env.VITE_PR_NUMBER || getGitPRNumber()
      ),
      'import.meta.env.VITE_CI_RUN_NUMBER': JSON.stringify(
        process.env.VITE_CI_RUN_NUMBER || getGitCommitCount()
      ),
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
              if (id.includes('vitals') || id.includes('sentry')) return 'monitor';
              return 'vendor';
            }
            if (id.includes('/debug/')) return 'debug';
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
      watchExclude: ['**/node_modules/**', '**/dist/**', '**/reports/**', '**/coverage/**'],
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
