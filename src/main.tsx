import ReactDOM from 'react-dom/client';
import React from 'react';
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
      <AppContainer />
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
