// src/main.tsx
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@toss/tds-mobile';
import './index.css';
import './utils/tossAuth';
import AppContainer from './AppContainer';

// [DEBUG] 가시적 로그 함수 (window.diagnosis는 index.html에 정의됨)
const log =
  ((window as unknown as Record<string, unknown>).diagnosis as typeof console.log | undefined) ||
  console.log;

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

  const Provider = ThemeProvider as unknown as React.ComponentType<{
    theme: unknown;
    children: React.ReactNode;
  }>;

  // 모든 환경에서 실제 ThemeProvider를 사용합니다.
  // 실제 Toss 앱 환경이 아닐 때도 TDS 스타일 변수들을 주입하기 위함입니다.
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
