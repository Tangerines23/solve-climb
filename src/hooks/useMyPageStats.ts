// 사용자 게임 통계를 가져오는 Custom Hook
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { type LocalSession } from '../utils/safeJsonParse';
import { storageService, STORAGE_KEYS } from '../services';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { isValidUUID } from '../utils/validation';

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
        if (localSession && isValidUUID(localSession.userId)) {
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
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase 세션이 없으면 로컬 세션 확인
      if (!session) {
        checkLocalSession();
      } else {
        setSession(session);
      }
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // 로컬 세션 확인
      let currentSession = null;
      let userId = null;

      try {
        const localSession = storageService.get<LocalSession>(STORAGE_KEYS.LOCAL_SESSION);
        if (localSession && isValidUUID(localSession.userId)) {
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

      // 로컬 세션 가드 제거 (DB 데이터가 있다면 조회 진행)

      // 프로필 정보 가져오기 (티어 정보 포함)
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
        console.error('[useMyPageStats] 프로필 조회 실패:', profileError);
        // 프로필 조회 실패 시에도 기본값으로 계속 진행
      }

      // 방법 1: RPC 함수 사용 (권장 - Supabase에 함수가 생성되어 있는 경우)
      try {
        const rpcResult = (await safeSupabaseQuery(
          supabase.rpc('get_user_game_stats')
        )) as unknown as { data: RpcStats[] | null; error: PostgrestError | null };
        const rpcData = rpcResult?.data;
        const rpcError = rpcResult?.error;

        if (!rpcError && rpcData && rpcData.length > 0) {
          const result = rpcData[0];
          setStats({
            totalSolved: result.total_solved || 0,
            maxLevel: result.max_level || 0,
            bestSubject: result.best_subject || null,
            totalMasteryScore: profileData?.total_mastery_score || 0,
            currentTierLevel: profileData?.current_tier_level ?? null,
            cyclePromotionPending: profileData?.cycle_promotion_pending || false,
            pendingCycleScore: profileData?.pending_cycle_score || 0,
            loginStreak: profileData?.login_streak || 0,
            totalGames: result.total_games || 0,
            totalCorrect: result.total_correct || 0,
            totalQuestions: result.total_questions || 0,
            bestStreak: result.best_streak || 0,
            avgSolveTime: result.avg_solve_time || 0,
            lastPlayedAt: result.last_played_at || null,
          });
          setLoading(false);
          return;
        }

        // RPC 함수가 404를 반환한 경우 (함수가 없거나 접근 불가)
        if (rpcError && rpcError.code === 'PGRST116') {
          // 404는 정상적인 폴백 시나리오이므로 경고만 출력
          console.warn('RPC function not found (404), falling back to direct query');
        } else if (rpcError) {
          // 다른 에러는 경고 출력
          console.warn('RPC function error, falling back to direct query:', rpcError);
        }
      } catch (rpcErr: unknown) {
        // RPC 함수가 없거나 실패한 경우, 직접 쿼리로 폴백
        const rpcErrTyped = rpcErr as { status?: number; code?: string };
        if (rpcErrTyped?.status === 404 || rpcErrTyped?.code === 'PGRST116') {
          console.warn('RPC function not found (404), falling back to direct query');
        } else {
          console.warn('RPC function not available, falling back to direct query:', rpcErr);
        }
      }

      // 방법 2: user_level_records 기반 직접 쿼리로 집계 (RPC 함수 실패 시 폴백)
      const recordsResult = (await safeSupabaseQuery(
        supabase
          .from('user_level_records')
          .select('world_id, category_id, subject_id, level, best_score')
          .eq('user_id', user_id)
      )) as unknown as {
        data: Array<{
          world_id: string;
          category_id: string;
          subject_id: string;
          level: number;
          best_score: number;
        }> | null;
        error: PostgrestError | null;
      };

      const levelRecords = recordsResult?.data;
      if (recordsResult.error) throw recordsResult.error;

      if (!levelRecords || levelRecords.length === 0) {
        setStats({
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
          totalMasteryScore: profileData?.total_mastery_score || 0,
          currentTierLevel: profileData?.current_tier_level ?? null,
          cyclePromotionPending: profileData?.cycle_promotion_pending || false,
          pendingCycleScore: profileData?.pending_cycle_score || 0,
          loginStreak: profileData?.login_streak || 0,
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

      // 통계 계산
      const totalMasteryScoreFromRecords = levelRecords.reduce(
        (sum, r) => sum + (r.best_score || 0),
        0
      );
      const totalSolved = levelRecords.filter((r) => (r.best_score || 0) > 0).length;
      const maxLevel = Math.max(...levelRecords.map((r) => r.level || 0));

      // 주력 분야: subject_id별 best_score 합계
      const subjectScores: Record<string, number> = {};
      levelRecords.forEach((r) => {
        subjectScores[r.subject_id] = (subjectScores[r.subject_id] || 0) + (r.best_score || 0);
      });

      const bestSubjectId = Object.entries(subjectScores).sort((a, b) => b[1] - a[1])[0]?.[0];

      setStats({
        totalSolved,
        maxLevel,
        bestSubject: bestSubjectId || null,
        totalMasteryScore: Math.max(
          totalMasteryScoreFromRecords,
          profileData?.total_mastery_score || 0
        ),
        currentTierLevel: profileData?.current_tier_level ?? null,
        cyclePromotionPending: profileData?.cycle_promotion_pending || false,
        pendingCycleScore: profileData?.pending_cycle_score || 0,
        loginStreak: profileData?.login_streak || 0,
        totalGames: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        bestStreak: 0,
        avgSolveTime: 0,
        lastPlayedAt: null,
      });
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    session,
    loading,
    error,
    refetch: fetchStats,
  };
}
