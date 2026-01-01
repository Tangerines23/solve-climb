/**
 * 에러 발생 시 표시되는 Fallback 컴포넌트
 * Error Boundary와 함께 사용됩니다.
 */

import './ErrorFallback.css';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="error-fallback">
      <div className="error-fallback-content">
        <div className="error-fallback-icon">⚠️</div>
        <h1 className="error-fallback-title">문제가 발생했습니다</h1>
        <p className="error-fallback-message">
          예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
        </p>

        {isDevelopment && (
          <div className="error-fallback-details">
            <details>
              <summary>에러 상세 정보 (개발 환경)</summary>
              <pre className="error-fallback-stack">{error.stack || error.message}</pre>
            </details>
          </div>
        )}

        <div className="error-fallback-actions">
          <button
            className="error-fallback-button error-fallback-button-primary"
            onClick={resetError}
          >
            다시 시도
          </button>
          <button
            className="error-fallback-button error-fallback-button-secondary"
            onClick={() => window.location.reload()}
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
