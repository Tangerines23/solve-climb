import { Suspense } from 'react';
import { resilientLazy } from '@/utils/resilientLazy';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = resilientLazy(() => import('@/App'), 'AppMain');

function AppContainer() {
  const diagnosis = (window as unknown as Record<string, unknown>).diagnosis;
  if (typeof diagnosis === 'function') {
    diagnosis('AppContainer Initializing...');
  }
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="loader-ring"></div>
      <div className="loader-title">Solve Climb</div>
      <div className="loader-subtitle">게임을 준비하고 있습니다...</div>
    </div>
  );
}

export default AppContainer;
