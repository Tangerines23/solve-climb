// src/AppContainer.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';

const App = lazy(() => import('@/App'));

function AppContainer() {
  const diagnosis = (window as unknown as Record<string, unknown>).diagnosis;
  if (typeof diagnosis === 'function') {
    diagnosis('AppContainer Initializing...');
  }
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="loading-fallback">
            <div className="loader-title">Solve Climb</div>
          </div>
        }
      >
        <App />
      </Suspense>
    </BrowserRouter>
  );
}

export default AppContainer;
