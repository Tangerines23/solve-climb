import React from 'react';
import './PauseModal.css';

interface PauseModalProps {
  isVisible: boolean;
  remainingPauses: number;
  onResume: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isVisible,
  remainingPauses,
  onResume,
  onExit,
}) => {
  if (!isVisible) return null;

  return (
    <div className="pause-modal-overlay">
      <div className="pause-modal-content">
        <h2 className="pause-title">PAUSED</h2>

        <div className="pause-info">
          <p className="pause-warning">
            재개 시 현재 문제가 <strong>교체</strong>됩니다.
          </p>
          <div className="pause-count-display">
            남은 일시정지 <span className="count-icon">⏳</span>:{' '}
            <span className="count-value">{remainingPauses}</span> / 3
          </div>
        </div>

        <div className="pause-actions">
          <button className="pause-btn resume" onClick={onResume}>
            <span className="btn-icon">▶️</span> 계속하기 (Resume)
          </button>
          <button className="pause-btn exit" onClick={onExit}>
            <span className="btn-icon">🚪</span> 그만하기 (Exit)
          </button>
        </div>
      </div>
    </div>
  );
};
