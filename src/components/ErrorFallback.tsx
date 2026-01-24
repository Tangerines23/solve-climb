import './ErrorFallback.css';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="error-fallback">
      <div className="error-fallback-content glass-card p-xl">
        <div className="error-fallback-icon">🧗‍♀️</div>
        <h1 className="error-fallback-title">산등성이에서 길을 잃었습니다</h1>
        <p className="error-fallback-message">
          예기치 못한 오류가 발생하여 정상으로 향하는 길이 일시적으로 차단되었습니다.
          <br />
          아래 버튼을 눌러 다시 등반을 시도해주세요.
        </p>

        {isDevelopment && (
          <div className="error-fallback-details">
            <details>
              <summary>🛠 개발자 전용 에러 로그</summary>
              <pre className="error-fallback-stack">{error.stack || error.message}</pre>
            </details>
          </div>
        )}

        <div className="error-fallback-actions">
          <button
            className="error-fallback-button error-fallback-button-primary"
            onClick={resetError}
          >
            다시 시도하기
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
