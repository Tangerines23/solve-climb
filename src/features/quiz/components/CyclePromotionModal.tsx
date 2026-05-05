import React from 'react';
import { useCyclePromotionModalBridge } from '../hooks/bridge/useCyclePromotionModalBridge';
import { BaseModal } from '@/components/BaseModal';
import './CyclePromotionModal.css';

interface CyclePromotionModalProps {
  isOpen: boolean;
  stars: number;
  pendingScore: number;
  onPromote: () => void;
  onClose: () => void;
}

export const CyclePromotionModal: React.FC<CyclePromotionModalProps> = ({
  isOpen,
  stars,
  pendingScore,
  onPromote,
  onClose,
}) => {
  const { isPromoting, error, handlePromote } = useCyclePromotionModalBridge(onPromote);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="👑 전설 달성! 👑"
      actions={
        <div className="cycle-promotion-actions">
          <button
            className="btn-base btn-primary cycle-promotion-button"
            onClick={handlePromote}
            disabled={isPromoting}
          >
            {isPromoting ? '처리 중...' : '다음 도전 시작하기'}
          </button>
          <button
            className="btn-base btn-secondary cycle-promotion-button"
            onClick={onClose}
            disabled={isPromoting}
          >
            나중에
          </button>
        </div>
      }
    >
      <div className="cycle-promotion-content">
        <p className="cycle-promotion-subtitle">
          축하합니다! 새로운 사이클을 시작할 준비가 되었습니다.
        </p>
        <div className="stars-display">{'★'.repeat(stars + 1)}</div>
        <p className="pending-score">이월될 점수: {pendingScore.toLocaleString()}점</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    </BaseModal>
  );
};
