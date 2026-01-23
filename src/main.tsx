import ReactDOM from 'react-dom/client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
});

import '@/index.css';
import '@/utils/tossAuth';
import AppContainer from '@/AppContainer';

import { logger } from '@/utils/logger';

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
