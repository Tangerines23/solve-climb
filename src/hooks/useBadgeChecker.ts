import { useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { debugSupabaseQuery } from '../utils/debugFetch';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { useBadgeStore } from '../stores/useBadgeStore';
import { HistoryStats } from '../hooks/useHistoryData';
import { validatedRpc, CheckAndAwardBadgesResponseSchema } from '../utils/rpcValidator';

export function useBadgeChecker() {
  const checkAndAwardBadges = useCallback(async (userId: string, stats: HistoryStats) => {
    if (!userId || !stats) return [];

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ||
      /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId);

    // --- 1. 정회원 (Server-Side Logic) ---
    if (isUuid) {
      const { data, error } = await validatedRpc(
        supabase.rpc('check_and_award_badges', { p_user_id: userId }),
        CheckAndAwardBadgesResponseSchema,
        'check_and_award_badges'
      );

      if (error || !data?.success) {
        console.error('Failed to check badges via RPC:', error);
        return [];
      }

      const newlyAwarded = data.awarded_badges || [];
      if (newlyAwarded.length > 0) {
        const { addUserBadge } = useBadgeStore.getState();
        for (const badgeId of newlyAwarded) {
          await addUserBadge(badgeId, userId);
        }
      }
      return newlyAwarded;
    }

    // --- 2. 익명 사용자 (Local Logic Fallback) ---
    const { data: userBadges, error: fetchError } = await debugSupabaseQuery(
      supabase.from('user_badges').select('badge_id').eq('user_id', userId)
    );

    if (fetchError) {
      console.error('Failed to fetch user badges for check:', fetchError);
      return [];
    }

    const earnedBadgeIds = new Set(userBadges?.map((b) => b.badge_id) || []);
    const newBadges: string[] = [];

    for (const badge of BADGE_DEFINITIONS as any[]) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let qualified = false;

      // Altitude
      if (badge.goalAltitude && stats.totalAltitude >= badge.goalAltitude) qualified = true;
      // Streak
      if (badge.goalStreak && stats.streakCount >= badge.goalStreak) qualified = true;
      // Accuracy
      if (badge.minAccuracy) {
        if (
          stats.weeklyTotal >= (badge.minGames || 10) &&
          stats.averageAccuracy >= badge.minAccuracy
        ) {
          qualified = true;
        }
      }
      // Subject Master
      if (badge.goalThemePart && badge.goalLevel) {
        const hasCleared = stats.categoryLevels.some(
          (cat) => cat.themeId.includes(badge.goalThemePart) && cat.level >= badge.goalLevel
        );
        if (hasCleared) qualified = true;
      }

      if (qualified) newBadges.push(badge.id);
    }

    if (newBadges.length > 0) {
      const { addUserBadge } = useBadgeStore.getState();
      for (const badgeId of newBadges) {
        await addUserBadge(badgeId, userId);
      }
    }

    return newBadges;
  }, []);

  return { checkAndAwardBadges };
}
