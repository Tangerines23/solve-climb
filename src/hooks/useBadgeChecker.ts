import { useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { useBadgeStore } from '../stores/useBadgeStore';
import { HistoryStats } from '../hooks/useHistoryData';
import { validatedRpc, CheckAndAwardBadgesResponseSchema } from '../utils/rpcValidator';

export function useBadgeChecker() {
  const checkAndAwardBadges = useCallback(async (userId: string, stats: HistoryStats) => {
    if (!userId || !stats) return [];

    // 입력 길이 제한으로 ReDoS 방지 (UUID 최대 36자)
    if (typeof userId !== 'string' || userId.length > 64) return [];

    // UUID 형식 검증 (고정 길이 패턴으로 ReDoS 안전)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidPattern.test(userId);

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
    const { data: userBadges, error: fetchError } = await safeSupabaseQuery(
      supabase.from('user_badges').select('badge_id').eq('user_id', userId)
    );

    if (fetchError) {
      console.error('Failed to fetch user badges for check:', fetchError);
      return [];
    }

    const earnedBadgeIds = new Set(userBadges?.map((b) => b.badge_id) || []);
    const newBadges: string[] = [];

    type BadgeDef = (typeof BADGE_DEFINITIONS)[number];
    for (const badge of BADGE_DEFINITIONS as BadgeDef[]) {
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
