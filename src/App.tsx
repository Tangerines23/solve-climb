// src/App.tsx
import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCustomBackNavigation } from '@/hooks/useCustomBackNavigation';
import { useDebugShortcuts } from '@/hooks/useDebugShortcuts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator';
import { useErrorLogStore } from '@/stores/useErrorLogStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useConnectivity } from '@/hooks/useConnectivity';
import { PwaUpdateNotification } from '@/components/PwaUpdateNotification';

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage }))
);
import { GlobalToastContainer } from '@/components/GlobalToastContainer';
const CategorySelectPage = lazy(() =>
  import('@/pages/CategorySelectPage').then((module) => ({ default: module.CategorySelectPage }))
);
const LevelSelectPage = lazy(() =>
  import('@/pages/LevelSelectPage').then((module) => ({ default: module.LevelSelectPage }))
);
const QuizPage = lazy(() =>
  import('@/pages/QuizPage').then((module) => ({ default: module.QuizPage }))
);
const ResultPage = lazy(() =>
  import('@/pages/ResultPage').then((module) => ({ default: module.ResultPage }))
);
const RankingPage = lazy(() =>
  import('@/pages/RankingPage').then((module) => ({ default: module.RankingPage }))
);
const RoadmapPage = lazy(() =>
  import('@/pages/RoadmapPage').then((module) => ({ default: module.RoadmapPage }))
);
const MyPage = lazy(() => import('@/pages/MyPage').then((module) => ({ default: module.MyPage })));
const NotificationPage = lazy(() =>
  import('@/pages/NotificationPage').then((module) => ({ default: module.NotificationPage }))
);
const DebugPage = lazy(() =>
  import('@/pages/DebugPage').then((module) => ({ default: module.DebugPage }))
);
// AuthCallbackPage & AuthTestPage imports removed
const ShopPage = lazy(() =>
  import('@/pages/ShopPage').then((module) => ({ default: module.ShopPage }))
);

// ⚠️ 개발 환경에서만 디버그 컴포넌트 로드
const DebugPanel = import.meta.env.DEV ? lazy(() => import('./components/DebugPanel')) : null;
const DebugOverlay = import.meta.env.DEV
  ? lazy(() => import('./components/debug/DebugOverlay').then((m) => ({ default: m.DebugOverlay })))
  : null;
const DebugReturnFloater = import.meta.env.DEV
  ? lazy(() =>
      import('./components/debug/DebugReturnFloater').then((m) => ({
        default: m.DebugReturnFloater,
      }))
    )
  : null;
const VisualGuardian = import.meta.env.DEV
  ? lazy(() =>
      import('./components/dev/VisualGuardian').then((m) => ({ default: m.VisualGuardian }))
    )
  : null;

function App() {
  // 네트워크 연결 상태 감시
  useConnectivity();

  const { syncProgress } = useLevelProgressStore();
  const { initialize: initializeAuth } = useAuthStore();

  // 커스텀 뒤로가기 네비게이션 적용
  useCustomBackNavigation();

  // ⚠️ 전역 디버그 단축키 (개발 환경에서만 활성화)
  useDebugShortcuts();

  const { isDebugPanelOpen } = useDebugStore(); // Debug store state for conditional rendering
  const animationEnabled = useSettingsStore((state) => state.animationEnabled);

  // 정적 UI 모드 전환 (body 클래스 제어)
  useEffect(() => {
    if (!animationEnabled) {
      document.body.classList.add('static-ui');
    } else {
      document.body.classList.remove('static-ui');
    }
  }, [animationEnabled]);

  useEffect(() => {
    initializeAuth().then(() => {
      syncProgress();
    });
  }, [initializeAuth, syncProgress]);

  // 전역 에러 핸들러 설정 (개발 환경에서만)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleError = (event: ErrorEvent) => {
      useErrorLogStore
        .getState()
        .addLog(
          'error',
          event.message || 'Unknown error',
          event.error?.stack,
          `Global: ${event.filename || 'unknown'}:${event.lineno || 0}`
        );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

      useErrorLogStore
        .getState()
        .addLog(
          'error',
          `Unhandled Promise Rejection: ${error.message}`,
          error.stack,
          'Global: UnhandledRejection'
        );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <GlobalLoadingIndicator />
      <GlobalToastContainer />
      {import.meta.env.VITE_CI !== 'true' && <PwaUpdateNotification />}
      <Suspense
        fallback={
          <div className="loading-fallback">
            <div className="loading-text">로딩 중...</div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category-select" element={<CategorySelectPage />} />
          <Route path="/level-select" element={<LevelSelectPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="/shop" element={<ShopPage />} />
        </Routes>

        {/* Global Debug Panel (Outside Routes, High Z-Index) */}
        {import.meta.env.DEV && isDebugPanelOpen && DebugPanel && <DebugPanel />}
        {/* Debug Visual Overlay (SafeArea guides, component borders) */}
        {import.meta.env.DEV && DebugOverlay && <DebugOverlay />}
        {/* Debug Return Floater (Quick back to debug page) */}
        {import.meta.env.DEV && DebugReturnFloater && <DebugReturnFloater />}
        {/* Visual Guardian (Overflow Detector) */}
        {import.meta.env.DEV && VisualGuardian && <VisualGuardian />}
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
