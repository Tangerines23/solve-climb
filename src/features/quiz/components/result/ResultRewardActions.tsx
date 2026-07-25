import React from 'react';
import { UI_MESSAGES } from '@/constants/ui';

interface ResultRewardActionsProps {
  baseMinerals: number;
  hasDoubled: boolean;
  isAdLoading: boolean;
  onDoubleReward: () => void;
}

export const ResultRewardActions: React.FC<ResultRewardActionsProps> = ({
  baseMinerals,
  hasDoubled,
  isAdLoading,
  onDoubleReward,
}) => {
  if (baseMinerals <= 0 || hasDoubled) return null;

  return (
    <div className="double-reward-section">
      <button className="double-reward-btn" onClick={onDoubleReward} disabled={isAdLoading}>
        <span>{isAdLoading ? '⌛' : '📺'}</span>{' '}
        {isAdLoading
          ? UI_MESSAGES.REWARD_GIVING
          : `${UI_MESSAGES.DOUBLE_REWARD} (+${baseMinerals}💎)`}
      </button>
    </div>
  );
};
