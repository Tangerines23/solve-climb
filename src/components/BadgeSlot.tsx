// src/components/BadgeSlot.tsx
import React, { useEffect, useState } from 'react';
import { useBadgeStore, BadgeDefinition, UserBadge } from '../stores/useBadgeStore';
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
      <div className="badge-icon">{badgeDef?.emoji || '🔒'}</div>
      <div className="badge-name">{badgeDef?.name || 'Loading...'}</div>
      <div className="badge-desc">{badgeDef?.description || '목표를 달성하세요'}</div>
      {isEarned && earnedAt && (
        <div className="badge-date">
          {new Date(earnedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  );
};

interface BadgeCollectionProps {
  userId: string;
  mode?: 'preview' | 'full';
  onBadgeClick?: (badgeId: string) => void;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ userId, mode = 'full' }) => {
  // Zustand Store Hooks
  const {
    badgeDefinitions,
    userBadges,
    fetchBadgeDefinitions,
    fetchUserBadges,
    isLoadingDefinitions,
    isLoadingUserBadges,
  } = useBadgeStore();

  // Initial Fetch
  useEffect(() => {
    fetchBadgeDefinitions();
    if (userId) {
      fetchUserBadges(userId);
    }
  }, [userId, fetchBadgeDefinitions, fetchUserBadges]);

  const [displayBadges, setDisplayBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    if (!userBadges || !badgeDefinitions.length) return;

    const allBadgeIds = badgeDefinitions.map((d) => d.id);
    const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));

    if (mode === 'preview') {
      const earned = userBadges;
      const locked = allBadgeIds
        .filter((id) => !earnedBadgeIds.has(id))
        .slice(0, 5 - earned.length)
        .map((id) => ({ badge_id: id, earned_at: '' }));

      setDisplayBadges([...earned, ...locked].slice(0, 5));
    } else {
      const lockedBadges = allBadgeIds.filter((id) => !earnedBadgeIds.has(id));
      setDisplayBadges([
        ...userBadges,
        ...lockedBadges.map((id) => ({ badge_id: id, earned_at: '' })),
      ]);
    }
  }, [userBadges, badgeDefinitions, mode]);

  if (isLoadingUserBadges || isLoadingDefinitions) {
    return <div className="badge-collection-loading">뱃지 로딩...</div>;
  }

  const defMap: Record<string, BadgeDefinition> = {};
  badgeDefinitions?.forEach((def) => {
    defMap[def.id] = def;
  });

  // Preview Mode UI
  if (mode === 'preview') {
    if (displayBadges.length === 0) {
      return <div className="badge-preview-empty">획득한 뱃지가 없습니다.</div>;
    }
    return (
      <div className="badge-collection-preview">
        {displayBadges.map((badge) => {
          const isEarned = badge.earned_at !== '';
          const badgeDef = defMap[badge.badge_id];
          return (
            <div key={badge.badge_id} className="badge-slot-mini">
              <div className={`badge-icon-mini ${isEarned ? 'earned' : 'locked'}`}>
                {isEarned && badgeDef?.emoji ? badgeDef.emoji : '🔒'}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full Mode UI (Existing)
  return (
    <div className="badge-collection">
      {displayBadges.length === 0 ? (
        <div className="badge-collection-empty">
          <p>아직 획득한 뱃지가 없습니다.</p>
          <p>레벨을 클리어하여 뱃지를 획득해보세요!</p>
        </div>
      ) : (
        <div className="badge-grid">
          {displayBadges.map((badge) => {
            const isEarned = badge.earned_at !== '';
            const badgeDef = defMap[badge.badge_id];
            return (
              <BadgeSlot
                key={badge.badge_id}
                badgeId={badge.badge_id}
                isEarned={isEarned}
                badgeDef={badgeDef || null}
                earnedAt={badge.earned_at || undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
