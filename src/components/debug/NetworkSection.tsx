import React from 'react';
import { useDebugActions } from '../../hooks/useDebugActions';
import './NetworkSection.css';

export const NetworkSection = React.memo(function NetworkSection() {
  const { networkLatency, forceNetworkError, setNetworkLatency, setForceNetworkError } =
    useDebugActions();

  const presetLatencies = [0, 500, 1000, 2000, 5000];

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🌐 네트워크 시뮬레이션</h3>

      <div className="debug-network-control">
        <div className="debug-network-item">
          <label className="debug-network-label">네트워크 지연</label>
          <div className="debug-network-latency">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={networkLatency}
              onChange={(e) => setNetworkLatency(Number(e.target.value))}
              className="debug-network-slider"
            />
            <span className="debug-network-value">
              {networkLatency === 0 ? 'OFF' : `${networkLatency}ms`}
            </span>
          </div>
          <div className="debug-network-presets">
            {presetLatencies.map((ms) => (
              <button
                key={ms}
                className={`debug-network-preset-button ${networkLatency === ms ? 'active' : ''}`}
                onClick={() => setNetworkLatency(ms)}
              >
                {ms === 0 ? 'OFF' : `${ms}ms`}
              </button>
            ))}
          </div>
        </div>

        <div className="debug-network-item">
          <label className="debug-network-label">강제 에러</label>
          <div className="debug-toggle-item">
            <span className="debug-toggle-label">모든 요청 실패</span>
            <button
              className={`debug-toggle-button ${forceNetworkError ? 'active error' : ''}`}
              onClick={() => setForceNetworkError(!forceNetworkError)}
              aria-label="강제 에러 토글"
            >
              {forceNetworkError ? 'ON' : 'OFF'}
            </button>
          </div>
          {forceNetworkError && (
            <div className="debug-network-warning">⚠️ 모든 네트워크 요청이 실패합니다</div>
          )}
        </div>
      </div>

      <div className="debug-network-status">
        <h4 className="debug-subsection-title">현재 상태</h4>
        <div className="debug-network-status-item">
          <span>지연:</span>
          <span className={networkLatency > 0 ? 'active' : ''}>
            {networkLatency === 0 ? '없음' : `${networkLatency}ms`}
          </span>
        </div>
        <div className="debug-network-status-item">
          <span>강제 에러:</span>
          <span className={forceNetworkError ? 'error' : ''}>
            {forceNetworkError ? '활성화' : '비활성화'}
          </span>
        </div>
      </div>
    </div>
  );
});
