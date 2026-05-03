import React from 'react';
import { useDebugActions } from '../../hooks/useDebugActions';
import './VisualSection.css';

export const VisualSection = React.memo(function VisualSection() {
  const { 
    showSafeAreaGuide, 
    showComponentBorders, 
    setShowSafeAreaGuide, 
    setShowComponentBorders,
    setGameCombo,
    setFeverLevel 
  } = useDebugActions();

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">📱 시각적 디버그</h3>

      <div className="debug-visual-control">
        <div className="debug-toggle-item">
          <div className="debug-toggle-info">
            <span className="debug-toggle-label">SafeArea 가이드</span>
            <span className="debug-toggle-description">상단 노치/하단 바 영역 표시</span>
          </div>
          <button
            className={`debug-toggle-button ${showSafeAreaGuide ? 'active' : ''}`}
            onClick={() => setShowSafeAreaGuide(!showSafeAreaGuide)}
            aria-label="SafeArea 가이드 토글"
          >
            {showSafeAreaGuide ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-toggle-item">
          <div className="debug-toggle-info">
            <span className="debug-toggle-label">컴포넌트 경계선</span>
            <span className="debug-toggle-description">모든 요소의 아웃라인 표시</span>
          </div>
          <button
            className={`debug-toggle-button ${showComponentBorders ? 'active' : ''}`}
            onClick={() => setShowComponentBorders(!showComponentBorders)}
            aria-label="컴포넌트 경계선 토글"
          >
            {showComponentBorders ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="debug-visual-info">
        <h4 className="debug-subsection-title">🔥 이펙트 테스트 (In-Game)</h4>
        <div
          className="debug-effect-controls"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-sm)',
            marginTop: 'var(--spacing-sm)',
          }}
        >
          <button
            className="debug-action-button"
            onClick={() => setFeverLevel(1)}
          >
            피버 1단계 (ON)
          </button>
          <button
            className="debug-action-button"
            onClick={() => setFeverLevel(2)}
          >
            피버 2단계 (ON)
          </button>
          <button
            className="debug-action-button"
            onClick={() => setFeverLevel(0)}
          >
            피버 끄기
          </button>
          <button
            className="debug-action-button"
            onClick={() => {
              // Note: For incremental combo, we might need to get current value, 
              // but for debug panel, absolute setters are usually fine.
              // If needed, we could add incrementGameCombo to useDebugActions.
              setGameCombo(1); 
            }}
          >
            콤보 1 설정
          </button>
          <button
            className="debug-action-button"
            onClick={() => {
              setGameCombo(10);
            }}
          >
            콤보 10 설정
          </button>
          <button
            className="debug-action-button"
            onClick={() => {
              setGameCombo(50);
            }}
          >
            콤보 50 (슈퍼)
          </button>
        </div>
      </div>

      <div className="debug-visual-info">
        <h4 className="debug-subsection-title">기기 참조값</h4>
        <div className="debug-visual-device-list">
          <div className="debug-visual-device-item">
            <span>iPhone 14 Pro</span>
            <span>상단 59px / 하단 34px</span>
          </div>
          <div className="debug-visual-device-item">
            <span>iPhone SE</span>
            <span>상단 20px / 하단 0px</span>
          </div>
          <div className="debug-visual-device-item">
            <span>Galaxy S23</span>
            <span>상단 48px / 하단 24px</span>
          </div>
        </div>
      </div>
    </div>
  );
});
