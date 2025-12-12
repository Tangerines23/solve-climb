// src/main.tsx
import React, { useState, useEffect, ComponentType } from 'react';
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

// 로딩 UI 컴포넌트
function LoadingFallback() {
  return (
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
  );
}

// 런타임 조건부 동적 import: ThemeProvider
function ConditionalThemeProvider({ children }: { children: React.ReactNode }) {
  const [TossThemeProvider, setTossThemeProvider] = useState<ComponentType<{ theme: typeof customTheme; children: React.ReactNode }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isTossEnvironment()) {
      setLoading(true);
      // 런타임에 조건부로만 import 수행
      import('@toss/tds-mobile')
        .then((module) => {
          setTossThemeProvider(() => module.ThemeProvider);
        })
        .catch((err) => {
          console.error('Failed to load Toss TDS:', err);
          setError(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // 심사 환경
  if (!isTossEnvironment()) {
    return <ThemeProviderFallback theme={customTheme}>{children}</ThemeProviderFallback>;
  }

  // 로딩 중
  if (loading) {
    return <LoadingFallback />;
  }

  // 에러 발생 시 대체 컴포넌트 사용
  if (error || !TossThemeProvider) {
    return <ThemeProviderFallback theme={customTheme}>{children}</ThemeProviderFallback>;
  }

  // Toss 환경 - 정상 로드
  return <TossThemeProvider theme={customTheme}>{children}</TossThemeProvider>;
}

// 런타임 조건부 동적 import: AppContainer
function ConditionalAppContainer() {
  const [AppContainer, setAppContainer] = useState<ComponentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // #region agent log
    const isToss = isTossEnvironment();
    fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'main.tsx:117',
        message: 'ConditionalAppContainer useEffect start',
        data: { isToss },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    // 심사 환경에서도 AppContainer를 로드 (TDS 의존성 없음)
    setLoading(true);
    import('./AppContainer')
      .then((module) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'main.tsx:122',
            message: 'AppContainer import success',
            data: { hasDefault: !!module.default },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C'
          })
        }).catch(() => {});
        // #endregion
        setAppContainer(() => module.default);
      })
      .catch((err) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'main.tsx:125',
            message: 'AppContainer import error',
            data: {
              errorName: err.name,
              errorMessage: err.message,
              errorStack: err.stack?.substring(0, 200)
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A,B,C,D,E'
          })
        }).catch(() => {});
        // #endregion
        console.error('Failed to load AppContainer:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 로딩 중
  if (loading) {
    return <LoadingFallback />;
  }

  // 에러 발생 시 대체 컴포넌트 사용
  if (error || !AppContainer) {
    return <AppContainerReview />;
  }

  // 정상 로드 (Toss 환경과 심사 환경 모두)
  return <AppContainer />;
}

function RootApp() {
  return (
    <ConditionalThemeProvider>
      <ConditionalAppContainer />
    </ConditionalThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);