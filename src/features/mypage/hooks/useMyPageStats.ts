// 사용자 게임 통계를 가져오는 Custom Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { isValidUUID } from '@/utils/validation';
import { logError } from '@/utils/errorHandler';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Session, PostgrestError } from '@supabase/supabase-js';

export interface MyPageStats {
  totalSolved: number;
  maxLevel: number;
  bestSubject: string | null;
  totalMasteryScore: number;
  currentTierLevel: number | null;
  cyclePromotionPending: boolean;
  pendingCycleScore: number;
  loginStreak: number;
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  avgSolveTime: number;
  lastPlayedAt: string | null;
}

const DEFAULT_STATS: MyPageStats = {
  totalSolved: 0,
  maxLevel: 0,
  bestSubject: null,
  totalMasteryScore: 0,
  currentTierLevel: null,
  cyclePromotionPending: false,
  pendingCycleScore: 0,
  loginStreak: 0,
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  bestStreak: 0,
  avgSolveTime: 0,
  lastPlayedAt: null,
};

interface ProfileData {
  total_mastery_score: number | null;
  current_tier_level: number | null;
  cycle_promotion_pending: boolean | null;
  pending_cycle_score: number | null;
  login_streak: number | null;
}

interface RpcStats {
  total_solved: number;
  max_level: number;
  best_subject: string | null;
  total_games: number;
  total_correct: number;
  total_questions: number;
  best_streak: number;
  avg_solve_time: number;
  last_played_at: string | null;
}

export interface UseMyPageStatsResult {
  stats: MyPageStats | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Supabase에서 사용자 게임 통계를 가져오는 Hook
 * useAuthStore를 SSOT로 사용하여 세션을 참조하고, 유저별 게임 통계를 집계합니다.
 */
export function useMyPageStats(): UseMyPageStatsResult {
  const [stats, setStats] = useState<MyPageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authSession = useAuthStore((state) => state.session);
  const authUser = useAuthStore((state) => state.user);

  // useAuthStore 기반 유효 세션 계산
  const session = useMemo<Session | null>(() => {
    if (authSession) return authSession;
    if (authUser) {
      return {
        user: authUser,
        access_token: 'local',
        refresh_token: 'local',
        expires_in: 3600,
        token_type: 'bearer',
      } as unknown as Session;
    }
    return null;
  }, [authSession, authUser]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = authSession?.user || authUser;
      const user_id = user?.id;

      if (!user || !user_id) {
        // 로그인하지 않은 경우 기본값 반환
        setStats(DEFAULT_STATS);
        setLoading(false);
        return;
      }

      // 게스트 유저(UUID가 아닌 ID)인 경우 DB 직쿼리 생략하고 기본값 세팅 후 리턴
      if (!isValidUUID(user_id)) {
        setStats(DEFAULT_STATS);
        setLoading(false);
        return;
      }

      const profileResult = (await safeSupabaseQuery(
        supabase
          .from('profiles')
          .select(
            'total_mastery_score, current_tier_level, cycle_promotion_pending, pending_cycle_score, login_streak'
          )
          .eq('id', user_id)
          .maybeSingle()
      )) as unknown as { data: ProfileData | null; error: PostgrestError | null };

      const profileData = profileResult?.data;
      const profileError = profileResult?.error;

      if (profileError) {
        logError('useMyPageStats#fetchStats_profile', profileError);
      }

      // 1. user_level_records 기반 레벨 클리어 통계 집계
      let totalSolved = 0;
      let maxLevel = 0;
      let bestSubjectId: string | null = null;
      let totalMasteryScoreFromRecords = 0;

      try {
        const recordsResult = (await safeSupabaseQuery(
          supabase
            .from('user_level_records')
            .select('world_id, category_id, subject_id, level, best_score, theme_code')
            .eq('user_id', user_id)
        )) as unknown as {
          data: Array<{
            world_id: string;
            category_id: string;
            subject_id: string;
            level: number;
            best_score: number;
            theme_code?: number;
          }> | null;
          error: PostgrestError | null;
        };

        const levelRecords = recordsResult?.data || [];
        if (levelRecords.length > 0) {
          totalMasteryScoreFromRecords = levelRecords.reduce(
            (sum, r) => sum + (r.best_score || 0),
            0
          );
          totalSolved = levelRecords.filter((r) => (r.best_score || 0) > 0).length;
          maxLevel = Math.max(...levelRecords.map((r) => r.level || 0));

          const subjectScores: Record<string, number> = {};
          levelRecords.forEach((r) => {
            const sub = r.subject_id || r.category_id || (r.theme_code === 1 ? 'math_add' : '기초');
            subjectScores[sub] = (subjectScores[sub] || 0) + (r.best_score || 0);
          });
          bestSubjectId = Object.entries(subjectScores).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        }
      } catch (recErr) {
        logError('useMyPageStats#fetchLevelRecords', recErr);
      }

      // 2. get_user_game_stats RPC 호출 및 결과 파싱
      let gameStats: Partial<RpcStats> = {};
      try {
        const rpcResult = await safeSupabaseQuery(supabase.rpc('get_user_game_stats'));
        const rawRpcData = rpcResult?.data;
        if (!rpcResult?.error && rawRpcData) {
          const parsed = Array.isArray(rawRpcData) ? rawRpcData[0] : rawRpcData;
          if (parsed && typeof parsed === 'object') {
            gameStats = parsed as Partial<RpcStats>;
          }
        }
      } catch (rpcErr: unknown) {
        console.warn('RPC get_user_game_stats fallback:', rpcErr);
      }

      setStats({
        totalSolved: gameStats.total_solved ?? totalSolved,
        maxLevel: gameStats.max_level ?? maxLevel,
        bestSubject: gameStats.best_subject ?? bestSubjectId,
        totalMasteryScore: Math.max(
          totalMasteryScoreFromRecords,
          profileData?.total_mastery_score || 0
        ),
        currentTierLevel: profileData?.current_tier_level ?? null,
        cyclePromotionPending: profileData?.cycle_promotion_pending || false,
        pendingCycleScore: profileData?.pending_cycle_score || 0,
        loginStreak: profileData?.login_streak || 0,
        totalGames: gameStats.total_games || 0,
        totalCorrect: gameStats.total_correct || 0,
        totalQuestions: gameStats.total_questions || 0,
        bestStreak: gameStats.best_streak || 0,
        avgSolveTime: gameStats.avg_solve_time || 0,
        lastPlayedAt: gameStats.last_played_at || null,
      });
    } catch (err) {
      logError('useMyPageStats#fetchStats', err);
      setError(err instanceof Error ? err.message : '통계를 불러오는 중 오류가 발생했습니다.');
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [authSession, authUser]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    session,
    loading,
    error,
    refetch: fetchStats,
  };
}
