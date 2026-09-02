// 사용자 게임 통계를 가져오는 Custom Hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { type LocalSession } from '@/utils/safeJsonParse';
import { storageService, STORAGE_KEYS } from '@/services';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { isValidUUID } from '@/utils/validation';
import { logError } from '@/utils/errorHandler';

import type { Session, PostgrestError, AuthChangeEvent } from '@supabase/supabase-js';

export interface MyPageStats {
  totalSolved: number;
  maxLevel: number;
  bestSubject: string | null;
  totalMasteryScore: number;
  currentTierLevel: number | null;
  cyclePromotionPending: boolean;
  pendingCycleScore: number;
  loginStreak: number;
  // New statistics fields
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  avgSolveTime: number;
  lastPlayedAt: string | null;
}

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
 *
 * RPC 함수를 사용하거나, 직접 쿼리로 집계합니다.
 */
export function useMyPageStats(): UseMyPageStatsResult {
  const [stats, setStats] = useState<MyPageStats | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 세션 상태 확인 (로컬 세션 포함)
  useEffect(() => {
    // 로컬 세션 확인
    const checkLocalSession = () => {
      try {
        const localSession = storageService.get<LocalSession>(STORAGE_KEYS.LOCAL_SESSION);
        const isGuestOrUUID =
          localSession?.userId &&
          (isValidUUID(localSession.userId) || String(localSession.userId).startsWith('guest-'));
        if (localSession && isGuestOrUUID) {
          // 로컬 세션이 있으면 가상 세션 객체 생성
          const virtualSession = {
            user: {
              id: localSession.userId,
              email: null,
              is_anonymous: true,
              user_metadata: {
                isAdmin: localSession.isAdmin || false,
              },
            },
            access_token: 'local',
            refresh_token: 'local',
            expires_in: 3600,
            token_type: 'bearer',
          } as unknown as Session;
          setSession(virtualSession);
          return;
        } else if (localSession) {
          // UUID가 아닌 레거시 ID가 있는 경우 무시 (authStore에서 이미 삭제했을 것이나 여기서도 가드)
          console.warn('[useMyPageStats] Ignoring legacy non-UUID session:', localSession.userId);
        }
      } catch (e) {
        console.warn('Failed to read local session:', e);
      }

      // Supabase 세션 확인
      safeSupabaseQuery(supabase.auth.getSession()).then((res) => {
        setSession(res?.data?.session || null);
      });
    };

    checkLocalSession();

    // 인증 상태 변경 리스너
    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        // Supabase 세션이 없으면 로컬 세션 확인
        if (!session) {
          checkLocalSession();
        } else {
          setSession(session);
        }
      }
    );

    return () => data?.subscription?.unsubscribe();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 로컬 세션 확인
      let currentSession = null;
      let userId = null;

      try {
        const localSession = storageService.get<LocalSession>(STORAGE_KEYS.LOCAL_SESSION);
        const isGuestOrUUID =
          localSession?.userId &&
          (isValidUUID(localSession.userId) || String(localSession.userId).startsWith('guest-'));
        if (localSession && isGuestOrUUID) {
          userId = localSession.userId;
          // 로컬 세션이 있으면 가상 세션 객체 생성
          currentSession = {
            user: {
              id: localSession.userId,
              email: null,
              is_anonymous: true,
              user_metadata: {
                isAdmin: localSession.isAdmin || false,
              },
            },
            access_token: 'local',
            refresh_token: 'local',
            expires_in: 3600,
            token_type: 'bearer',
          } as unknown as Session;
          setSession(currentSession);
        }
      } catch (e) {
        console.warn('Failed to read local session:', e);
      }

      // Supabase 세션 확인 (로컬 세션이 없을 때만)
      if (!currentSession) {
        const authResult = await safeSupabaseQuery(supabase.auth.getSession());
        currentSession = authResult?.data?.session;
        setSession(currentSession);
      }

      if (!currentSession) {
        // 로그인하지 않은 경우 기본값 반환
        setStats({
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
        });
        setLoading(false);
        return;
      }

      const user = currentSession.user;
      const user_id = userId || user.id;

      // 게스트 유저(UUID가 아닌 ID)인 경우 DB 직쿼리 생략하고 기본값 세팅 후 리턴
      if (!isValidUUID(user_id)) {
        setStats({
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
        });
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
        // 프로필 조회 실패 시에도 기본값으로 계속 진행
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

      // 2. get_user_game_stats RPC 호출 및 결과 파싱 (객체/배열 모두 지원)
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
      // 에러 발생 시 기본값 설정
      setStats({
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
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
