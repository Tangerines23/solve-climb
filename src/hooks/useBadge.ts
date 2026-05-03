import { useEffect } from 'react';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { BadgeDefinition, UserBadge } from '@/types/badge';

export const useBadge = (userId?: string) => {
  const {
    badgeDefinitions,
    userBadges,
    fetchBadgeDefinitions,
    fetchUserBadges,
    addUserBadge,
    isLoadingDefinitions,
    isLoadingUserBadges,
  } = useBadgeStore();

  useEffect(() => {
    fetchBadgeDefinitions();
    if (userId) {
      fetchUserBadges(userId);
    }
  }, [userId, fetchBadgeDefinitions, fetchUserBadges]);

  const earnBadge = async (badgeId: string) => {
    if (userId) {
      await addUserBadge(badgeId, userId);
    }
  };

  return {
    badgeDefinitions,
    userBadges,
    isLoading: isLoadingDefinitions || isLoadingUserBadges,
    earnBadge,
  };
};

export type { BadgeDefinition, UserBadge };
