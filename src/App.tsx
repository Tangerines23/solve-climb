import { useEffect } from 'react';
import { resilientLazy } from '@/utils/resilientLazy';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLevelProgressStore } from '@/features/quiz';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCustomBackNavigation } from '@/hooks/useCustomBackNavigation';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator';
import { useErrorLogStore } from '@/stores/useErrorLogStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useConnectivity } from '@/hooks/useConnectivity';
import { PwaUpdateNotification } from '@/components/PwaUpdateNotification';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useUserStore } from '@/stores/useUserStore';
import { useQuizStore, type TimeLimit } from '@/features/quiz';
import { logger } from '@/utils/logger';
import { registerHapticConfig } from '@/utils/haptic';
import { registerDebugConfig } from '@/utils/debugFetch';
import { registerDebugBridge } from '@/hooks/useQuickActionsDebugBridge';

const HomePage = resilientLazy(
  () => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
  'HomePage'
);
import { GlobalToastContainer } from '@/components/GlobalToastContainer';
const CategorySelectPage = resilientLazy(
  () => import('@/features/quiz').then((module) => ({ default: module.CategorySelectPage })),
  'CategorySelectPage'
);
const LevelSelectPage = resilientLazy(
  () => import('@/features/quiz').then((module) => ({ default: module.LevelSelectPage })),
  'LevelSelectPage'
);
const QuizPage = resilientLazy(
  () => import('@/features/quiz').then((module) => ({ default: module.QuizPage })),
  'QuizPage'
);
const ResultPage = resilientLazy(
  () => import('@/features/quiz').then((module) => ({ default: module.ResultPage })),
  'ResultPage'
);
const RankingPage = resilientLazy(
  () => import('@/pages/RankingPage').then((module) => ({ default: module.RankingPage })),
  'RankingPage'
);
const RoadmapPage = resilientLazy(
  () => import('@/pages/RoadmapPage').then((module) => ({ default: module.RoadmapPage })),
  'RoadmapPage'
);
const MyPage = resilientLazy(
  () => import('@/pages/MyPage').then((module) => ({ default: module.MyPage })),
  'MyPage'
);
const NotificationPage = resilientLazy(
  () => import('@/pages/NotificationPage').then((module) => ({ default: module.NotificationPage })),
  'NotificationPage'
);
const DebugPage = resilientLazy(
  () => import('@/pages/DebugPage').then((module) => ({ default: module.DebugPage })),
  'DebugPage'
);
const PrivacyPolicyPage = resilientLazy(
  () =>
    import('@/pages/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })),
  'PrivacyPolicyPage'
);
// AuthCallbackPage & AuthTestPage imports removed
const ShopPage = resilientLazy(
  () => import('@/pages/ShopPage').then((module) => ({ default: module.ShopPage })),
  'ShopPage'
);

// ⚠️ 개발 환경에서만 디버그 컴포넌트 로드 (CI 환경 제외)
const isCI = import.meta.env.VITE_CI === 'true';
const shouldShowDebug = !import.meta.env.PROD && !isCI;

const DebugPanel = !shouldShowDebug
  ? () => null
  : resilientLazy(() => import('./components/DebugPanel'), 'DebugPanel');
const DebugOverlay = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () => import('./components/debug/DebugOverlay').then((m) => ({ default: m.DebugOverlay })),
      'DebugOverlay'
    );
const DebugReturnFloater = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () =>
        import('./components/debug/DebugReturnFloater').then((m) => ({
          default: m.DebugReturnFloater,
        })),
      'DebugReturnFloater'
    );
const VisualGuardian = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () => import('./components/dev/VisualGuardian').then((m) => ({ default: m.VisualGuardian })),
      'VisualGuardian'
    );
const DebugShortcutsWrapper = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () => import('./components/debug/DebugShortcutsWrapper'),
      'DebugShortcutsWrapper'
    );

function App() {
  // 네트워크 연결 상태 감시
  useConnectivity();

  const { syncProgress } = useLevelProgressStore();
  const { initialize: initializeAuth } = useAuthStore();

  // 커스텀 뒤로가기 네비게이션 적용
  useCustomBackNavigation();

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
    // Parallelize initialization to avoid waterfalls
    // syncProgress internally checks for user session, so it can run concurrently
    Promise.all([initializeAuth(), syncProgress()]);
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

  // Logger -> Store 동기화 등록
  useEffect(() => {
    const unregister = logger.registerHandler((level, message, stack, context) => {
      useErrorLogStore.getState().addLog(level, message, stack, context);
    });
    return unregister;
  }, []);

  // Utility -> Store 동기화 등록
  useEffect(() => {
    registerHapticConfig(() => useSettingsStore.getState().hapticEnabled);
    registerDebugConfig(() => ({
      networkLatency: useDebugStore.getState().networkLatency,
      forceNetworkError: useDebugStore.getState().forceNetworkError,
    }));
    registerDebugBridge({
      setMinerals: async (val: number) => {
        await useUserStore.getState().debugSetMinerals(val);
      },
      setStamina: async (val: number) => {
        await useUserStore.getState().debugSetStamina(val);
      },
      setTimeLimit: (val: number) => {
        useQuizStore.getState().setTimeLimit(val as TimeLimit);
      },
      fetchUserData: async () => {
        await useUserStore.getState().fetchUserData();
      },
    });
  }, []);

  return (
    <>
      <GlobalLoadingIndicator />
      <GlobalToastContainer />
      {import.meta.env.VITE_CI !== 'true' && <PwaUpdateNotification />}
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/category-select"
          element={
            <RequireAuth>
              <CategorySelectPage />
            </RequireAuth>
          }
        />
        <Route
          path="/level-select"
          element={
            <RequireAuth>
              <LevelSelectPage />
            </RequireAuth>
          }
        />
        <Route
          path="/quiz"
          element={
            <RequireAuth>
              <QuizPage />
            </RequireAuth>
          }
        />
        <Route
          path="/result"
          element={
            <RequireAuth>
              <ResultPage />
            </RequireAuth>
          }
        />
        <Route
          path="/ranking"
          element={
            <RequireAuth>
              <RankingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/roadmap"
          element={
            <RequireAuth>
              <RoadmapPage />
            </RequireAuth>
          }
        />
        <Route path="/my-page" element={<MyPage />} />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/debug"
          element={
            <RequireAuth>
              <DebugPage />
            </RequireAuth>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <RequireAuth>
              <PrivacyPolicyPage />
            </RequireAuth>
          }
        />
        <Route
          path="/shop"
          element={
            <RequireAuth>
              <ShopPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Debug Panel (Outside Routes, High Z-Index) */}
      {import.meta.env.DEV && isDebugPanelOpen && DebugPanel && <DebugPanel />}
      {/* Debug Visual Overlay (SafeArea guides, component borders) */}
      {import.meta.env.DEV && DebugOverlay && <DebugOverlay />}
      {/* Debug Return Floater (Quick back to debug page) */}
      {import.meta.env.DEV && DebugReturnFloater && <DebugReturnFloater />}
      {/* Visual Guardian (Overflow Detector) */}
      {import.meta.env.DEV && VisualGuardian && <VisualGuardian />}
      {/* Debug Shortcuts (Lazy Loaded) */}
      {import.meta.env.DEV && DebugShortcutsWrapper && <DebugShortcutsWrapper />}
    </>
  );
}

export default App;
