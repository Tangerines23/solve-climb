// 사용자 게임 통계를 가져오는 Custom Hook
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { parseLocalSession } from '../utils/safeJsonParse';
import { storage, StorageKeys } from '../utils/storage';
import { debugSupabaseQuery } from '../utils/debugFetch';
import type { Session, PostgrestError } from '@supabase/supabase-js';

export interface MyPageStats {
  totalSolved: number;
  maxLevel: number;
  bestSubject: string | null;
  totalMasteryScore: number;
  currentTierLevel: number | null;
  cyclePromotionPending: boolean;
  pendingCycleScore: number;
}

interface ProfileData {
  total_mastery_score: number | null;
  current_tier_level: number | null;
  cycle_promotion_pending: boolean | null;
  pending_cycle_score: number | null;
}

interface RpcStats {
  total_solved: number;
  max_level: number;
  best_subject: string | null;
}

interface ThemeMapping {
  code: number;
  theme_id: string;
  name: string;
}

interface LevelRecordData {
  theme_code: number;
  level: number;
  best_score: number;
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
        const localSessionStr = storage.getString(StorageKeys.LOCAL_SESSION);
        const localSession = parseLocalSession(localSessionStr);
        if (localSession) {
          // 로컬 세션이 있으면 가상 세션 객체 생성
          const virtualSession = {
            user: {
              id: localSession.userId,
              email: null,
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
        }
      } catch (e) {
        console.warn('Failed to read local session:', e);
      }

      // Supabase 세션 확인
      debugSupabaseQuery(supabase.auth.getSession()).then((res) => {
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
        const localSessionStr = storage.getString(StorageKeys.LOCAL_SESSION);
        const localSession = parseLocalSession(localSessionStr);
        if (localSession) {
          userId = localSession.userId;
          // 로컬 세션이 있으면 가상 세션 객체 생성
          currentSession = {
            user: {
              id: localSession.userId,
              email: null,
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
        const authResult = await debugSupabaseQuery(supabase.auth.getSession());
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
        });
        setLoading(false);
        return;
      }

      const user = currentSession.user;
      const user_id = userId || user.id;

      // 로컬 세션 가드 제거 (DB 데이터가 있다면 조회 진행)

      // 프로필 정보 가져오기 (티어 정보 포함)
      const profileResult = (await debugSupabaseQuery(
        supabase
          .from('profiles')
          .select(
            'total_mastery_score, current_tier_level, cycle_promotion_pending, pending_cycle_score'
          )
          .eq('id', user_id)
          .single()
      )) as unknown as { data: ProfileData | null; error: PostgrestError | null };

      const profileData = profileResult?.data;
      const profileError = profileResult?.error;

      if (profileError) {
        console.error('[useMyPageStats] 프로필 조회 실패:', profileError);
        // 프로필 조회 실패 시에도 기본값으로 계속 진행
      }

      // 방법 1: RPC 함수 사용 (권장 - Supabase에 함수가 생성되어 있는 경우)
      try {
        const rpcResult = (await debugSupabaseQuery(
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

      // 방법 2: user_level_records 기반 직접 쿼리로 집계 (RPC 함수가 없는 경우 폴백)
      // theme_mapping 조회
      const themeResult = (await debugSupabaseQuery(
        supabase.from('theme_mapping').select('code, theme_id, name')
      )) as unknown as { data: ThemeMapping[] | null; error: PostgrestError | null };

      const themeMapping = themeResult?.data;
      const themeError = themeResult?.error;

      if (themeError) {
        console.warn('[useMyPageStats] theme_mapping 조회 실패:', themeError);
      }

      // theme_code -> theme_id 매핑 생성
      const themeCodeToId: Record<number, string> = {};
      const themeCodeToName: Record<number, string> = {};
      themeMapping?.forEach((tm) => {
        themeCodeToId[tm.code] = tm.theme_id;
        themeCodeToName[tm.code] = tm.name;
      });

      // user_level_records 조회
      const recordsResult = (await debugSupabaseQuery(
        supabase
          .from('user_level_records')
          .select('theme_code, level, best_score')
          .eq('user_id', user_id)
      )) as unknown as { data: LevelRecordData[] | null; error: PostgrestError | null };

      const levelRecords = recordsResult?.data;
      const queryError = recordsResult?.error;

      if (queryError) {
        throw queryError;
      }

      if (!levelRecords || levelRecords.length === 0) {
        setStats({
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
          totalMasteryScore: profileData?.total_mastery_score || 0,
          currentTierLevel: profileData?.current_tier_level ?? null,
          cyclePromotionPending: profileData?.cycle_promotion_pending || false,
          pendingCycleScore: profileData?.pending_cycle_score || 0,
        });
        setLoading(false);
        return;
      }

      // 통계 계산 함수들
      const totalMasteryScoreFromRecords = levelRecords.reduce(
        (sum: number, r) => sum + (r.best_score || 0),
        0
      );

      // 완등 문제: user_level_records에 기록된 모든 행의 수 (theme/level/mode 조합)
      const totalSolved = levelRecords.filter((r) => (r.best_score || 0) > 0).length;

      // 최고 레벨: 최대 level 값
      const maxLevel =
        levelRecords.length > 0 ? Math.max(...levelRecords.map((r) => r.level || 0)) : 0;

      // 주력 분야: theme_code별 best_score 합계, 가장 높은 theme_id 반환
      const themeScores: Record<number, number> = {};
      levelRecords.forEach((record) => {
        if (record.theme_code) {
          themeScores[record.theme_code] =
            (themeScores[record.theme_code] || 0) + (record.best_score || 0);
        }
      });

      let bestSubject: string | null = null;
      if (Object.keys(themeScores).length > 0) {
        const bestThemeCode = Object.entries(themeScores).sort((a, b) => b[1] - a[1])[0][0];
        const bestThemeCodeNum = parseInt(bestThemeCode, 10);
        // theme_id 반환 (없으면 name, 그것도 없으면 null)
        bestSubject = themeCodeToId[bestThemeCodeNum] || themeCodeToName[bestThemeCodeNum] || null;
      }

      setStats({
        totalSolved,
        maxLevel,
        bestSubject,
        totalMasteryScore: Math.max(
          totalMasteryScoreFromRecords,
          profileData?.total_mastery_score || 0
        ),
        currentTierLevel: profileData?.current_tier_level ?? null,
        cyclePromotionPending: profileData?.cycle_promotion_pending || false,
        pendingCycleScore: profileData?.pending_cycle_score || 0,
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
