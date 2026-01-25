import { useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { debugSupabaseQuery } from '../utils/debugFetch';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { useBadgeStore } from '../stores/useBadgeStore';
import { HistoryStats } from '../hooks/useHistoryData';

export function useBadgeChecker() {
  const checkAndAwardBadges = useCallback(async (userId: string, stats: HistoryStats) => {
    if (!userId || !stats) return;

    // 1. Get user's current badges
    const { data: userBadges, error } = await debugSupabaseQuery(
      supabase.from('user_badges').select('badge_id').eq('user_id', userId)
    );

    if (error) {
      console.error('Failed to fetch user badges for check:', error);
      return;
    }

    const earnedBadgeIds = new Set(userBadges?.map((b) => b.badge_id) || []);
    const newBadges: string[] = [];

    // 2. Check each condition
    for (const badge of BADGE_DEFINITIONS) {
      if (earnedBadgeIds.has(badge.id)) continue; // Already earned

      let qualified = false;

      // --- Condition Logic Switch ---
      // Altitude
      if (badge.goalAltitude) {
        if (stats.totalAltitude >= badge.goalAltitude) {
          qualified = true;
        }
      }
      // Streak
      if (badge.goalStreak) {
        if (stats.streakCount >= badge.goalStreak) {
          qualified = true;
        }
      }
      // Accuracy (Using averageAccuracy and approximating total games via weeklyTotal which holds userLevelCount)
      if (badge.minAccuracy) {
        // weeklyTotal is currently mapped to 'userLevelCount' in useHistoryData
        const totalGamesPlayed = stats.weeklyTotal;
        if (
          totalGamesPlayed >= (badge.minGames || 10) &&
          stats.averageAccuracy >= badge.minAccuracy
        ) {
          qualified = true;
        }
        if (
          totalGamesPlayed >= (badge.minGames || 10) &&
          stats.averageAccuracy >= badge.minAccuracy
        ) {
          qualified = true;
        }
      }
      // Subject Master (Check categoryLevels)
      if (badge.goalThemePart && badge.goalLevel) {
        const hasClearedLevel = stats.categoryLevels.some(
          (cat) => cat.themeId.includes(badge.goalThemePart) && cat.level >= badge.goalLevel
        );
        if (hasClearedLevel) {
          qualified = true;
        }
      }

      if (qualified) {
        newBadges.push(badge.id);
      }
    }

    // 3. Award new badges
    if (newBadges.length > 0) {
      console.log('Awarding new badges:', newBadges);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      if (!isUuid) {
        // 익명 사용자: 로컬 스토리지 저장 (Store Action 사용)
        const { addUserBadge } = useBadgeStore.getState();
        for (const badgeId of newBadges) {
          await addUserBadge(badgeId, userId);
        }
        return newBadges;
      }

      // 정회원: DB 저장
      // Use RPC grant or direct insert loop
      // Direct insert is safer if RPC is debug-only
      const inserts = newBadges.map((id) => ({
        user_id: userId,
        badge_id: id,
        earned_at: new Date().toISOString(),
      }));

      const { error: insertError } = await debugSupabaseQuery(
        supabase.from('user_badges').insert(inserts)
      );

      if (insertError) {
        console.error('Failed to grant badges:', insertError);
      } else {
        // 정회원도 스토어 업데이트 (UI 즉시 반영을 위해)
        const { addUserBadge } = useBadgeStore.getState();
        for (const badgeId of newBadges) {
          // DB 저장은 위에서 했으므로, addUserBadge는 상태 업데이트 용도로만 사용
          // (addUserBadge 내부 로직이 중복 저장해도 UI 상태만 갱신하므로 안전)
          await addUserBadge(badgeId, userId);
        }
      }
    }

    return newBadges;
  }, []);

  return { checkAndAwardBadges };
}
