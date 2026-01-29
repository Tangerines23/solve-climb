import ReactDOM from 'react-dom/client';
import React from 'react';
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

// 서비스 워커 등록 (Vite PWA 플러그인에 의해 자동으로 처리됨)
/*
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('SW registration failed:', error);
    });
  });
}
*/

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
      <AppContainer />
    </React.Fragment>
  );

  logger.log('Render Initialized.');

  // 성공 시 로더 제거
  setTimeout(() => {
    const loader = document.getElementById('loading-check');
    const isCI = window.navigator.userAgent.includes('Playwright');

    if (loader) {
      if (isCI) {
        loader.style.display = 'none';
      } else {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }
    }
  }, 1000);
} catch (err) {
  logger.error('Main', 'Render Crash!', err);
  if (window.onerror) {
    window.onerror(String(err), 'main.tsx', 0, 0, err as Error);
  }
}
