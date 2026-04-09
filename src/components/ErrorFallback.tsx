import { useConnectivity } from '../hooks/useConnectivity';
import { useToastStore } from '../stores/useToastStore';
import './ErrorFallback.css';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;
  const showToast = useToastStore((state) => state.showToast);
  const isOnline = useConnectivity();

  // 특수 에러 타입 판별
  const isChunkLoadError =
    (error as any).isChunkLoadError ||
    error.message.includes('fetch') ||
    error.message.includes('Loading chunk');

  const handleCopyError = () => {
    const errorText = `[${isChunkLoadError ? 'CHUNK_ERROR' : 'APP_ERROR'}] ${error.message}\n\nURL: ${window.location.href}\nTime: ${new Date().toLocaleString()}\n\nStack:\n${error.stack || ''}`;
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
        <div className="error-fallback-icon">
          {!isOnline ? '📡' : isChunkLoadError ? '📦' : '🧗‍♀️'}
        </div>
        <h1 className="error-fallback-title" data-testid="error-fallback-title">
          {!isOnline
            ? '네트워크 연결이 끊겼습니다'
            : isChunkLoadError
              ? '리소스 로드에 실패했습니다'
              : '산등성이에서 길을 잃었습니다'}
        </h1>
        <p className="error-fallback-message" data-testid="error-fallback-message">
          {!isOnline
            ? '현재 오프라인 상태입니다. 네트워크가 다시 연결되면 자동으로 시도할 수 있습니다.'
            : isChunkLoadError
              ? '필요한 파일을 불러오지 못했습니다. 연결을 확인하고 다시 시도해주세요.'
              : '예기치 못한 오류가 발생하여 정상으로 향하는 길이 일시적으로 차단되었습니다.'}
        </p>

        {isDevelopment && (
          <div className="error-fallback-details">
            <details open>
              <summary>🛠 Developer Debug Console</summary>
              <div className="debug-info-grid">
                <div className="debug-info-item">
                  <span className="debug-label">Error Code:</span>
                  <span className="debug-value code-font">
                    {isChunkLoadError ? 'CHUNK_LOAD_FAILURE' : 'APP_RUNTIME_ERROR'}
                  </span>
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
            className={`error-fallback-button error-fallback-button-primary ${!isOnline ? 'disabled' : ''}`}
            onClick={resetError}
            disabled={!isOnline}
          >
            {!isOnline ? '연결 대기 중...' : '다시 시도하기'}
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
