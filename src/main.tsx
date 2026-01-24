import ReactDOM from 'react-dom/client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // 특정 에러 코드는 재시도하지 않음
        if (error?.status === 404 || error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Mutation은 수동 제어 권장
    },
  },
});
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: 'solve-climb@0.8.0', // package.json 버전과 동기화 권장
});

import '@/index.css';
import '@/utils/tossAuth';
import AppContainer from '@/AppContainer';

import { logger } from '@/utils/logger';
import { logEnvInfo } from '@/utils/env';
import { performanceMonitor } from '@/utils/performance';

// 성능 모니터링 시작
performanceMonitor.init();

// 서비스 워커 등록 (프로덕션 환경)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('SW registration failed:', error);
    });
  });
}

// 초기 환경 정보 출력
logEnvInfo();

logger.log('JavaScript Executed. Initializing React...');

/**
 * 렌더링 시작
 */
try {
  logger.info('Main', 'Starting React Render...');

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);

  // ThemeProvider 제거: UI 독립성을 위해 React.Fragment로 대체합니다.
  root.render(
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
        <AppContainer />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.Fragment>
  );

  logger.log('Render Initialized.');

  // 성공 시 로더 제거
  setTimeout(() => {
    const loader = document.getElementById('loading-check');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }
  }, 1000);
} catch (err) {
  logger.error('Main', 'Render Crash!', err);
  if (window.onerror) {
    window.onerror(String(err), 'main.tsx', 0, 0, err as Error);
  }
}
