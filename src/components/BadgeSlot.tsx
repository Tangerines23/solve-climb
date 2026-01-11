// src/components/BadgeSlot.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import './BadgeSlot.css';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface BadgeSlotProps {
  badgeId: string;
  isEarned: boolean;
  badgeDef: BadgeDefinition | null;
  earnedAt?: string;
}

export const BadgeSlot: React.FC<BadgeSlotProps> = ({
  isEarned,
  badgeDef,
  earnedAt,
}) => {
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

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  userId,
  mode = 'full',
}) => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState<Record<string, BadgeDefinition>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        // 사용자 뱃지 조회
        const { data: userBadges, error: badgesError } = await supabase
          .from('user_badges')
          .select('badge_id, earned_at')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (badgesError) throw badgesError;

        // 뱃지 정의 조회
        const { data: definitions, error: defError } = await supabase
          .from('badge_definitions')
          .select('id, name, description, emoji');

        if (defError) throw defError;

        const defMap: Record<string, BadgeDefinition> = {};
        definitions?.forEach((def) => {
          defMap[def.id] = def;
        });
        setBadgeDefinitions(defMap);

        // 모든 뱃지 정의 가져오기
        const allBadgeIds = definitions?.map((d) => d.id) || [];
        const earnedBadgeIds = new Set(userBadges?.map((b) => b.badge_id) || []);

        // Preview 모드에서는 획득한 뱃지만 보여주거나, 없으면 빈 상태
        // Full 모드에서는 락된 뱃지도 보여줌
        let displayBadges: UserBadge[] = [];

        if (mode === 'preview') {
          // 획득한 것 위주 + 락된 것도 몇 개 보여주기?
          // 일단 획득한 것만 먼저, 그리고 나머지는 락된 걸로 채워서 5개 정도?
          const earned = (userBadges || []);
          const locked = allBadgeIds
            .filter(id => !earnedBadgeIds.has(id))
            .slice(0, 5 - earned.length)
            .map(id => ({ badge_id: id, earned_at: '' }));

          displayBadges = [...earned, ...locked].slice(0, 5);
        } else {
          const lockedBadges = allBadgeIds.filter((id) => !earnedBadgeIds.has(id));
          displayBadges = [
            ...(userBadges || []),
            ...lockedBadges.map((id) => ({ badge_id: id, earned_at: '' })),
          ];
        }

        setBadges(displayBadges);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadBadges();
    }
  }, [userId, mode]);

  if (loading) {
    return <div className="badge-collection-loading">뱃지 로딩...</div>;
  }

  // Preview Mode UI
  if (mode === 'preview') {
    if (badges.length === 0) {
      return <div className="badge-preview-empty">획득한 뱃지가 없습니다.</div>;
    }
    return (
      <div className="badge-collection-preview">
        {badges.map((badge) => {
          const isEarned = badge.earned_at !== '';
          const badgeDef = badgeDefinitions[badge.badge_id];
          return (
            <div key={badge.badge_id} className="badge-slot-mini">
              <div className={`badge-icon-mini ${isEarned ? 'earned' : 'locked'}`}>
                {isEarned && badgeDef?.emoji ? badgeDef.emoji : '🔒'}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Full Mode UI (Existing)
  return (
    <div className="badge-collection">
      {/* Title removed here, let parent handle it if needed, or keep it? Original had title. Keeping it for Full mode compatibility if used elsewhere. */}
      {/* <h3 className="badge-collection-title">획득한 뱃지</h3> */}

      {badges.length === 0 ? (
        <div className="badge-collection-empty">
          <p>아직 획득한 뱃지가 없습니다.</p>
          <p>레벨을 클리어하여 뱃지를 획득해보세요!</p>
        </div>
      ) : (
        <div className="badge-grid">
          {badges.map((badge) => {
            const isEarned = badge.earned_at !== '';
            const badgeDef = badgeDefinitions[badge.badge_id];
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
