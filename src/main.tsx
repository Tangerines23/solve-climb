// src/main.tsx
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Button이 theme.colors.backgroundColor를 정상 참조할 수 있도록 customTheme 객체를 생성합니다.
const customTheme = {
  colors: {
    backgroundColor: '#FFFFFF', // 흰색 배경
  },
};

// 조건 체크 함수: UserAgent에 'Toss' 포함 또는 localhost일 때만 true
function isTossEnvironment(): boolean {
  const userAgent = navigator.userAgent || '';
  const hostname = window.location.hostname;
  return userAgent.includes('Toss') || hostname === 'localhost';
}

// ThemeProvider 대체 컴포넌트 (심사 환경용)
function ThemeProviderFallback({ theme, children }: { theme: typeof customTheme; children: React.ReactNode }) {
  return <div>{children}</div>;
}

// 동적 import: ThemeProvider
const TossThemeProvider = lazy(() =>
  import('@toss/tds-mobile').then((module) => ({
    default: module.ThemeProvider,
  }))
);

// 동적 import: AppContainer
const AppContainer = lazy(() => import('./AppContainer'));

// 심사용 AppContainer 대체 컴포넌트 (경량 버전)
function AppContainerReview() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-xl)',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      <h1 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
        Solve Climb
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        심사 환경에서는 TDS를 사용할 수 없습니다.
      </p>
    </div>
  );
}

// 조건에 따라 ThemeProvider와 AppContainer를 렌더링
const isToss = isTossEnvironment();

function RootApp() {
  if (isToss) {
    return (
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
          >
            <div>로딩 중...</div>
          </div>
        }
      >
        <TossThemeProvider theme={customTheme}>
          <AppContainer />
        </TossThemeProvider>
      </Suspense>
    );
  } else {
    return (
      <ThemeProviderFallback theme={customTheme}>
        <AppContainerReview />
      </ThemeProviderFallback>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);