import React, { useState, useEffect, useMemo } from 'react';
import { useErrorLogStore, type ErrorLogEntry } from '../../stores/useErrorLogStore';
import './ErrorLogSection.css';

export const ErrorLogSection = React.memo(function ErrorLogSection() {
  const { logs, clearLogs, filterLogs } = useErrorLogStore();
  const [filterLevel, setFilterLevel] = useState<'error' | 'warning' | 'info' | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<ErrorLogEntry[]>([]);

  const filteredByTimeAndLevel = useMemo(() => {
    let result = logs;

    // 레벨 필터
    if (filterLevel !== 'all') {
      result = filterLogs(filterLevel);
    }

    // 시간 필터
    if (timeFilter !== 'all') {
      const now = new Date();
      let startTime: Date;

      switch (timeFilter) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(0);
      }

      result = result.filter((log) => log.timestamp >= startTime);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          (log.context && log.context.toLowerCase().includes(query)) ||
          (log.stack && log.stack.toLowerCase().includes(query))
      );
    }

    return result;
  }, [logs, filterLevel, timeFilter, searchQuery, filterLogs]);

  useEffect(() => {
    setFilteredLogs(filteredByTimeAndLevel);
  }, [filteredByTimeAndLevel]);

  const handleClearLogs = () => {
    if (confirm('모든 로그를 삭제하시겠습니까?')) {
      clearLogs();
    }
  };

  const handleExportLogs = () => {
    try {
      const exportData = {
        logs: filteredLogs.map((log) => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          level: log.level,
          message: log.message,
          stack: log.stack,
          context: log.context,
        })),
        exportTime: new Date().toISOString(),
        totalCount: filteredLogs.length,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('로그 내보내기 실패:', err);
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
        <div className="debug-log-search">
          <input
            type="text"
            className="debug-log-search-input"
            placeholder="검색 (메시지, 컨텍스트, 스택)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="debug-log-filters">
          <div className="debug-log-filter-group">
            <span className="debug-log-filter-label">레벨:</span>
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

          <div className="debug-log-filter-group">
            <span className="debug-log-filter-label">시간:</span>
            <button
              className={`debug-log-filter-button ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
            >
              전체
            </button>
            <button
              className={`debug-log-filter-button ${timeFilter === '1h' ? 'active' : ''}`}
              onClick={() => setTimeFilter('1h')}
            >
              최근 1시간
            </button>
            <button
              className={`debug-log-filter-button ${timeFilter === '24h' ? 'active' : ''}`}
              onClick={() => setTimeFilter('24h')}
            >
              최근 24시간
            </button>
            <button
              className={`debug-log-filter-button ${timeFilter === '7d' ? 'active' : ''}`}
              onClick={() => setTimeFilter('7d')}
            >
              최근 7일
            </button>
          </div>
        </div>

        <div className="debug-log-actions">
          <button
            className="debug-log-export-button"
            onClick={handleExportLogs}
            disabled={filteredLogs.length === 0}
          >
            내보내기 ({filteredLogs.length})
          </button>
          <button className="debug-log-clear-button" onClick={handleClearLogs}>
            로그 클리어
          </button>
        </div>
      </div>

      <div className="debug-log-list">
        {filteredLogs.length === 0 ? (
          <div className="debug-log-empty">로그가 없습니다.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="debug-log-entry">
              <div className="debug-log-header">
                <span className="debug-log-level" style={{ color: getLevelColor(log.level) }}>
                  {log.level.toUpperCase()}
                </span>
                <span className="debug-log-time">{log.timestamp.toLocaleString('ko-KR')}</span>
              </div>
              {log.context && <div className="debug-log-context">{log.context}</div>}
              <div className="debug-log-message">{log.message}</div>
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
});
