// src/components/BadgeSlot.tsx
import React from 'react';
import { BadgeDefinition } from '@/types/badge';
import './BadgeSlot.css';

interface BadgeSlotProps {
  badgeId: string;
  isEarned: boolean;
  badgeDef: BadgeDefinition | null;
  earnedAt?: string;
}

export const BadgeSlot: React.FC<BadgeSlotProps> = ({ isEarned, badgeDef, earnedAt }) => {
  return (
    <div
      className={`badge-slot ${isEarned ? 'badge-earned' : 'badge-locked'}`}
      onClick={() => {
        // Simple alert for now, or assume parent handles click if passed
      }}
    >
      <div className="badge-icon" role="img" aria-label={badgeDef?.name || '잠긴 뱃지'}>
        {badgeDef?.emoji || '🔒'}
      </div>
      <div className="badge-name">{badgeDef?.name || '데이터 로딩 중...'}</div>
      <div className="badge-desc">{badgeDef?.description || '목표를 달성하세요'}</div>
      {isEarned && earnedAt && (
        <div className="badge-date">
          {new Date(earnedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  );
};
