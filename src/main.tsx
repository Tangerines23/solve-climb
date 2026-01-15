import ReactDOM from 'react-dom/client';
import React from 'react';
import './index.css';
import './utils/tossAuth';
import AppContainer from './AppContainer';

// [DEBUG] 가시적 로그 함수 (window.diagnosis는 index.html에 정의됨)
const log =
  ((window as unknown as Record<string, unknown>).diagnosis as typeof console.log | undefined) ||
  console.log;

log('JavaScript Executed. Initializing React...');

/**
 * 렌더링 시작
 */
try {
  log('Starting React Render...');

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

  log('Render Initialized.');

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
  log('Render Crash!', '#ff4444');
  console.error(err);
  if (window.onerror) {
    window.onerror(String(err), 'main.tsx', 0, 0, err as Error);
  }
}
