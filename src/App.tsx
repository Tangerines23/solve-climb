// src/App.tsx
import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLevelProgressStore } from './stores/useLevelProgressStore';
import { useCustomBackNavigation } from './hooks/useCustomBackNavigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalLoadingIndicator } from './components/GlobalLoadingIndicator';

// 페이지 컴포넌트 레이지 로딩
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const SubCategoryPage = lazy(() => import('./pages/SubCategoryPage').then(module => ({ default: module.SubCategoryPage })));
const LanguageDetailPage = lazy(() => import('./pages/LanguageDetailPage').then(module => ({ default: module.LanguageDetailPage })));
const CategorySelectPage = lazy(() => import('./pages/CategorySelectPage').then(module => ({ default: module.CategorySelectPage })));
const LevelSelectPage = lazy(() => import('./pages/LevelSelectPage').then(module => ({ default: module.LevelSelectPage })));
const MathQuizPage = lazy(() => import('./pages/MathQuizPage').then(module => ({ default: module.MathQuizPage })));
const ResultPage = lazy(() => import('./pages/ResultPage').then(module => ({ default: module.ResultPage })));
const RankingPage = lazy(() => import('./pages/RankingPage').then(module => ({ default: module.RankingPage })));
const MyPage = lazy(() => import('./pages/MyPage').then(module => ({ default: module.MyPage })));
const NotificationPage = lazy(() => import('./pages/NotificationPage').then(module => ({ default: module.NotificationPage })));

function App() {
  const { syncProgress } = useLevelProgressStore();
  
  // 커스텀 뒤로가기 네비게이션 적용
  useCustomBackNavigation();

  useEffect(() => {
    syncProgress();
  }, [syncProgress]);

  return (
    <ErrorBoundary>
      <GlobalLoadingIndicator />
      <Suspense fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--color-text-primary)'
        }}>
          <div>로딩 중...</div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subcategory" element={<SubCategoryPage />} />
          <Route path="/language-detail" element={<LanguageDetailPage />} />
          <Route path="/category-select" element={<CategorySelectPage />} />
          <Route path="/level-select" element={<LevelSelectPage />} />
          <Route path="/math-quiz" element={<MathQuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;