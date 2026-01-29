import { getErrorCode } from '../utils/errorHandler';
import { useToastStore } from '../stores/useToastStore';
import './ErrorFallback.css';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;
  const showToast = useToastStore((state) => state.showToast);

  const handleCopyError = () => {
    const errorCode = getErrorCode(error);
    const errorText = `[${errorCode}] ${error.message}\n\nURL: ${window.location.href}\nTime: ${new Date().toLocaleString()}\n\nStack:\n${error.stack || ''}`;
    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        showToast('에러 로그가 복사되었습니다!', '📋');
      })
      .catch((err) => {
        console.error('Failed to copy error:', err);
        prompt('Ctrl+C를 눌러 복사하세요:', errorText);
      });
  };

  return (
    <div className="error-fallback">
      <div className="error-fallback-content glass-card p-xl">
        <div className="error-fallback-icon">🧗‍♀️</div>
        <h1 className="error-fallback-title" data-testid="error-fallback-title">
          산등성이에서 길을 잃었습니다
        </h1>
        <p className="error-fallback-message" data-testid="error-fallback-message">
          예기치 못한 오류가 발생하여 정상으로 향하는 길이 일시적으로 차단되었습니다.
          <br />
          아래 버튼을 눌러 다시 등반을 시도해주세요.
        </p>

        {isDevelopment && (
          <div className="error-fallback-details">
            <details open>
              <summary>🛠 Developer Debug Console</summary>
              <div className="debug-info-grid">
                <div className="debug-info-item">
                  <span className="debug-label">Error Code:</span>
                  <span className="debug-value code-font">{getErrorCode(error)}</span>
                </div>
                <div className="debug-info-item">
                  <span className="debug-label">Timestamp:</span>
                  <span className="debug-value">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="debug-info-item">
                  <span className="debug-label">Location:</span>
                  <span className="debug-value truncate">{window.location.pathname}</span>
                </div>
              </div>
              <div className="error-stack-container">
                <pre className="error-fallback-stack">{error.stack || error.message}</pre>
                <button
                  className="copy-debug-btn"
                  onClick={handleCopyError}
                  title="에러 로그 전체 복사"
                >
                  📋 Copy Deep Log
                </button>
              </div>
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
