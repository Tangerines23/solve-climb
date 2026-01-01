import React from 'react';
import './StaminaWarningModal.css';

interface StaminaWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAnyway: () => void;
  onWatchAd: () => void;
}

export const StaminaWarningModal: React.FC<StaminaWarningModalProps> = ({
  isOpen,
  onClose,
  onPlayAnyway,
  onWatchAd,
}) => {
  if (!isOpen) return null;

  return (
    <div className="stamina-modal-overlay">
      <div className="stamina-modal-content fade-in">
        <div className="stamina-modal-header">
          <span className="warning-icon">⚡</span>
          <h2>체력이 부족합니다</h2>
        </div>
        <div className="stamina-modal-body">
          <p>
            스태미나가 부족하여 <strong>지친 상태</strong>로 등반하게 됩니다.
          </p>
          <ul className="penalty-list">
            <li>
              ⚠️ 획득 점수와 미네랄이 <strong>80%</strong>로 감소합니다.
            </li>
            <li>⚠️ 화면이 붉게 어두워집니다.</li>
          </ul>
        </div>
        <div className="stamina-modal-footer">
          <button className="ad-button" onClick={onWatchAd}>
            <span className="icon">📺</span> 광고 보고 충전
          </button>
          <button className="play-anyway-button" onClick={onPlayAnyway}>
            그냥 플레이하기
          </button>
          <button className="close-link" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
