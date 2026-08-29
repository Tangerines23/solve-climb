import { useEffect } from 'react';
import { resilientLazy } from '@/utils/resilientLazy';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCustomBackNavigation } from '@/hooks/useCustomBackNavigation';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator';
import { useErrorLogStore } from '@/stores/useErrorLogStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useConnectivity } from '@/hooks/useConnectivity';
import { PwaUpdateNotification } from '@/components/PwaUpdateNotification';
import { RequireAuth } from '@/features/auth';
import { supabase } from '@/utils/supabaseClient';
import { initializeGoogleSignIn } from '@/utils/auth';
import { Capacitor } from '@capacitor/core';

const HomePage = resilientLazy(
  () => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
  'HomePage'
);
import { GlobalToastContainer } from '@/components/GlobalToastContainer';
import { GlobalBgmManager } from '@/components/GlobalBgmManager';
const CategorySelectPage = resilientLazy(
  () =>
    import('@/pages/CategorySelectPage').then((module) => ({ default: module.CategorySelectPage })),
  'CategorySelectPage'
);
const LevelSelectPage = resilientLazy(
  () => import('@/pages/LevelSelectPage').then((module) => ({ default: module.LevelSelectPage })),
  'LevelSelectPage'
);
const QuizPage = resilientLazy(
  () => import('@/pages/QuizPage').then((module) => ({ default: module.QuizPage })),
  'QuizPage'
);
const ResultPage = resilientLazy(
  () => import('@/pages/ResultPage').then((module) => ({ default: module.ResultPage })),
  'ResultPage'
);
const RankingPage = resilientLazy(
  () => import('@/features/ranking').then((module) => ({ default: module.RankingPage })),
  'RankingPage'
);
const RoadmapPage = resilientLazy(
  () => import('@/pages/RoadmapPage').then((module) => ({ default: module.RoadmapPage })),
  'RoadmapPage'
);
const ReviewPage = resilientLazy(
  () => import('@/pages/ReviewPage').then((module) => ({ default: module.ReviewPage })),
  'ReviewPage'
);
const MyPage = resilientLazy(
  () => import('@/features/mypage').then((module) => ({ default: module.MyPage })),
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
  () => import('@/features/item').then((module) => ({ default: module.ShopPage })),
  'ShopPage'
);

// ⚠️ 개발 환경에서만 디버그 컴포넌트 로드 (CI 환경 제외)
const isCI = import.meta.env.VITE_CI === 'true';
const shouldShowDebug = !import.meta.env.PROD && !isCI;

const DebugPanel = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () => import('@/features/debug').then((m) => ({ default: m.DebugPanel })),
      'DebugPanel'
    );
const DebugOverlay = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () => import('@/features/debug').then((m) => ({ default: m.DebugOverlay })),
      'DebugOverlay'
    );
const DebugReturnFloater = !shouldShowDebug
  ? () => null
  : resilientLazy(
      () => import('@/features/debug').then((m) => ({ default: m.DebugReturnFloater })),
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
      () => import('@/features/debug').then((m) => ({ default: m.DebugShortcutsWrapper })),
      'DebugShortcutsWrapper'
    );

function App() {
  const location = useLocation();
  const { initialize: initializeAuth } = useAuthStore();
  const { syncProgress } = useLevelProgressStore();

  // 네트워크 연결 상태 감시
  useConnectivity();

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

    // Capacitor 네이티브 앱 환경에서 Deep Link (Supabase OAuth 세션 복귀) 수신 리스너 등록
    const isNativeApp = Capacitor.isNativePlatform();
    if (isNativeApp) {
      // Capacitor Google Auth 초기화
      initializeGoogleSignIn().catch((err) => {
        console.error('[GoogleSignIn] Initialization failed:', err);
      });

      import('@capacitor/app')
        .then(({ App }) => {
          App.addListener('appUrlOpen', async (data: { url: string }) => {
            // 데이터 형식: com.solveclimb.app://google-callback?token=... 또는 com.solveclimb.app://my-page?token=...
            const urlStr = data.url;
            if (urlStr.includes('access_token=') || urlStr.includes('refresh_token=')) {
              // URL 해시(#) 또는 쿼리(?) 파라미터 파싱
              const rawParams = urlStr.includes('#')
                ? urlStr.split('#')[1]
                : urlStr.includes('?')
                  ? urlStr.split('?')[1]
                  : '';
              if (rawParams) {
                const params = new URLSearchParams(rawParams);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                  // Supabase 클라이언트에 세션 세팅
                  const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                  if (!error) {
                    console.log('[Auth] Deep Link OAuth Session initialized successfully');
                    // 세션 초기화 상태 동기화 및 갱신
                    await initializeAuth();
                    await syncProgress();
                  } else {
                    console.error('[Auth] Failed to set session from deep link:', error.message);
                  }
                }
              }
            }
          });
        })
        .catch((err) => {
          console.error('[Capacitor] Failed to load App plugin:', err);
        });
    }
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
    <>
      <GlobalBgmManager />
      <GlobalLoadingIndicator />
      <GlobalToastContainer />
      {import.meta.env.VITE_CI !== 'true' && <PwaUpdateNotification />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <RequireAuth>
                <PageTransition>
                  <HomePage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/category-select"
            element={
              <RequireAuth>
                <PageTransition>
                  <CategorySelectPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/level-select"
            element={
              <RequireAuth>
                <PageTransition>
                  <LevelSelectPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/quiz"
            element={
              <RequireAuth>
                <PageTransition>
                  <QuizPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/result"
            element={
              <RequireAuth>
                <PageTransition>
                  <ResultPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/ranking"
            element={
              <RequireAuth>
                <PageTransition>
                  <RankingPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/roadmap"
            element={
              <RequireAuth>
                <PageTransition>
                  <RoadmapPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/review"
            element={
              <RequireAuth>
                <PageTransition>
                  <ReviewPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/my-page"
            element={
              <RequireAuth>
                <PageTransition>
                  <MyPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <PageTransition>
                  <NotificationPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/debug"
            element={
              <RequireAuth>
                <PageTransition>
                  <DebugPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <PageTransition>
                <PrivacyPolicyPage />
              </PageTransition>
            }
          />
          <Route
            path="/shop"
            element={
              <RequireAuth>
                <PageTransition>
                  <ShopPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

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
