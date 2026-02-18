import React from 'react';
import { BaseModal } from '../BaseModal';
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
  return (
    <BaseModal
      isOpen={isVisible}
      onClose={onResume}
      title="PAUSED"
      actions={
        <div className="pause-actions">
          <button className="btn-base btn-primary pause-btn resume" onClick={onResume}>
            <span className="btn-icon">▶️</span> 계속하기 (Resume)
          </button>
          <button className="btn-base btn-secondary pause-btn exit" onClick={onExit}>
            <span className="btn-icon">🚪</span> 그만하기 (Exit)
          </button>
        </div>
      }
    >
      <div className="pause-info">
        <p className="pause-warning">
          재개 시 현재 문제가 <strong>교체</strong>됩니다.
        </p>
        <div className="pause-count-display">
          남은 일시정지 <span className="count-icon">⏳</span>:{' '}
          <span className="count-value">{remainingPauses}</span> / 3
        </div>
      </div>
    </BaseModal>
  );
};
