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
  badgeId: _badgeId,
  isEarned,
  badgeDef,
  earnedAt,
}) => {
  return (
    <div className={`badge-slot ${isEarned ? 'badge-earned' : 'badge-locked'}`}>
      <div className="badge-icon">{isEarned && badgeDef?.emoji ? badgeDef.emoji : '🔒'}</div>
      <div className="badge-name">{isEarned && badgeDef ? badgeDef.name : '???'}</div>
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
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ userId }) => {
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

        setBadges(userBadges || []);

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

        // 모든 뱃지 정의 가져오기 (획득하지 않은 뱃지도 표시)
        const allBadgeIds = definitions?.map((d) => d.id) || [];
        const earnedBadgeIds = new Set(userBadges?.map((b) => b.badge_id) || []);
        const lockedBadges = allBadgeIds.filter((id) => !earnedBadgeIds.has(id));

        // 락된 뱃지도 표시하기 위해 추가
        const allBadges: UserBadge[] = [
          ...(userBadges || []),
          ...lockedBadges.map((id) => ({ badge_id: id, earned_at: '' })),
        ];
        setBadges(allBadges);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadBadges();
    }
  }, [userId]);

  if (loading) {
    return <div className="badge-collection-loading">뱃지 불러오는 중...</div>;
  }

  return (
    <div className="badge-collection">
      <h3 className="badge-collection-title">획득한 뱃지</h3>
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
