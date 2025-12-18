// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@toss/tds-mobile'; // 정적 임포트로 변경하여 로딩 불확실성 제거
import './index.css';
import './utils/tossAuth';
import AppContainer from './AppContainer';

// [DEBUG] 가시적 로그 함수 (window.diagnosis는 index.html에 정의됨)
const log = (window as any).diagnosis || console.log;

log('JavaScript Executed. Initializing React...');

const customTheme = {
  colors: {
    backgroundColor: '#FFFFFF',
  },
};

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

  // ThemeProvider의 theme 타입 에러를 해결하기 위해 any로 캐스팅
  const Provider = ThemeProvider as any;

  root.render(
    <Provider theme={customTheme}>
      <AppContainer />
    </Provider>
  );

  log('Render Initialized.');

  // 성공 시 로더 제거
  setTimeout(() => {
    const loader = document.getElementById('loading-check');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, 1000);

} catch (err) {
  log('Render Crash!', '#ff4444');
  console.error(err);
  if (window.onerror) {
    window.onerror(String(err), 'main.tsx', 0, 0, err as Error);
  }
}