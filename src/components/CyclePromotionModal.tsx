// src/components/CyclePromotionModal.tsx
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
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
  const [isPromoting, setIsPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePromote = async () => {
    setIsPromoting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('promote_to_next_cycle');

      if (rpcError) {
        throw rpcError;
      }

      if (data && data.success) {
        onPromote();
      } else {
        setError(data?.error || '승급 처리에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to promote:', err);
      setError('승급 처리 중 오류가 발생했습니다.');
    } finally {
      setIsPromoting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cycle-promotion-modal-overlay" onClick={onClose}>
      <div className="cycle-promotion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cycle-promotion-header">
          <h2>👑 전설 달성! 👑</h2>
          <p>축하합니다! 새로운 사이클을 시작할 준비가 되었습니다.</p>
        </div>

        <div className="cycle-promotion-content">
          <div className="stars-display">{'★'.repeat(stars + 1)}</div>
          <p className="pending-score">이월될 점수: {pendingScore.toLocaleString()}점</p>
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="cycle-promotion-actions">
          <button className="promote-button" onClick={handlePromote} disabled={isPromoting}>
            {isPromoting ? '처리 중...' : '다음 도전 시작하기'}
          </button>
          <button className="cancel-button" onClick={onClose} disabled={isPromoting}>
            나중에
          </button>
        </div>
      </div>
    </div>
  );
};
