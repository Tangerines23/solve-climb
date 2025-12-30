import { useState, useEffect } from 'react';
import { useErrorLogStore, type ErrorLogEntry } from '../../stores/useErrorLogStore';
import './ErrorLogSection.css';

export function ErrorLogSection() {
  const { logs, clearLogs, filterLogs } = useErrorLogStore();
  const [filterLevel, setFilterLevel] = useState<'error' | 'warning' | 'info' | 'all'>('all');
  const [filteredLogs, setFilteredLogs] = useState<ErrorLogEntry[]>([]);

  useEffect(() => {
    if (filterLevel === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(filterLogs(filterLevel));
    }
  }, [logs, filterLevel, filterLogs]);

  const handleClearLogs = () => {
    if (confirm('모든 로그를 삭제하시겠습니까?')) {
      clearLogs();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'var(--color-red-500)';
      case 'warning':
        return 'var(--color-bg-tertiary)';
      case 'info':
        return 'var(--color-blue-400)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">⚠️ 에러 로그</h3>

      <div className="debug-log-controls">
        <div className="debug-log-filters">
          <button
            className={`debug-log-filter-button ${filterLevel === 'all' ? 'active' : ''}`}
            onClick={() => setFilterLevel('all')}
          >
            전체
          </button>
          <button
            className={`debug-log-filter-button ${filterLevel === 'error' ? 'active' : ''}`}
            onClick={() => setFilterLevel('error')}
          >
            에러
          </button>
          <button
            className={`debug-log-filter-button ${filterLevel === 'warning' ? 'active' : ''}`}
            onClick={() => setFilterLevel('warning')}
          >
            경고
          </button>
          <button
            className={`debug-log-filter-button ${filterLevel === 'info' ? 'active' : ''}`}
            onClick={() => setFilterLevel('info')}
          >
            정보
          </button>
        </div>
        <button
          className="debug-log-clear-button"
          onClick={handleClearLogs}
        >
          로그 클리어
        </button>
      </div>

      <div className="debug-log-list">
        {filteredLogs.length === 0 ? (
          <div className="debug-log-empty">
            로그가 없습니다.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="debug-log-entry">
              <div className="debug-log-header">
                <span
                  className="debug-log-level"
                  style={{ color: getLevelColor(log.level) }}
                >
                  {log.level.toUpperCase()}
                </span>
                <span className="debug-log-time">
                  {log.timestamp.toLocaleString('ko-KR')}
                </span>
              </div>
              {log.context && (
                <div className="debug-log-context">
                  {log.context}
                </div>
              )}
              <div className="debug-log-message">
                {log.message}
              </div>
              {log.stack && (
                <details className="debug-log-stack">
                  <summary>스택 트레이스</summary>
                  <pre>{log.stack}</pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

