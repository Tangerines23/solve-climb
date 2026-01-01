// src/main.tsx
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

  // 토스 환경 감지 (userAgent 기준)
  const isToss = typeof window !== 'undefined' && /Toss/i.test(navigator.userAgent);

  // ThemeProvider의 theme 타입 에러를 해결하기 위해 any로 캐스팅
  const Provider = ThemeProvider as any;

  if (isToss) {
    root.render(
      <Provider theme={customTheme}>
        <AppContainer />
      </Provider>
    );
  } else {
    // Vercel 등 외부 브라우저 환경에서는 TDS ThemeProvider를 건너뜁니다.
    // TDS는 토스 앱 내부가 아니면 에러를 던지기 때문입니다.
    log('External Browser Detected. Bypassing TDS Provider.');
    root.render(<AppContainer />);
  }

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
