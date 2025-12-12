// 사용자 게임 통계를 가져오는 Custom Hook
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { parseLocalSession } from '../utils/safeJsonParse';
import { storage, StorageKeys } from '../utils/storage';
import type { Session } from '@supabase/supabase-js';

export interface MyPageStats {
  totalHeight: number;
  totalSolved: number;
  maxLevel: number;
  bestSubject: string | null;
}

interface UseMyPageStatsResult {
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
          } as any;
          setSession(virtualSession);
          return;
        }
      } catch (e) {
        console.warn('Failed to read local session:', e);
      }

      // Supabase 세션 확인
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    };

    checkLocalSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase 세션이 없으면 로컬 세션 확인
      if (!session) {
        checkLocalSession();
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
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
          } as any;
          setSession(currentSession);
        }
      } catch (e) {
        console.warn('Failed to read local session:', e);
      }

      // Supabase 세션 확인 (로컬 세션이 없을 때만)
      if (!currentSession) {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        currentSession = supabaseSession;
        setSession(supabaseSession);
      }

      if (!currentSession) {
        // 로그인하지 않은 경우 기본값 반환
        setStats({
          totalHeight: 0,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
        setLoading(false);
        return;
      }

      const user = currentSession.user;
      const user_id = userId || user.id;

      // 방법 1: RPC 함수 사용 (권장 - Supabase에 함수가 생성되어 있는 경우)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_game_stats');
        
        if (!rpcError && rpcData && rpcData.length > 0) {
          const result = rpcData[0];
          setStats({
            totalHeight: result.total_height || 0,
            totalSolved: result.total_solved || 0,
            maxLevel: result.max_level || 0,
            bestSubject: result.best_subject || null,
          });
          setLoading(false);
          return;
        }
      } catch (rpcErr) {
        // RPC 함수가 없거나 실패한 경우, 직접 쿼리로 폴백
        console.warn('RPC function not available, falling back to direct query:', rpcErr);
      }

      // 방법 2: 직접 쿼리로 집계 (RPC 함수가 없는 경우 폴백)
      // 로컬 세션인 경우 Supabase 쿼리 스킵
      if (user_id === 'tester' || user_id.startsWith('tester_') || user_id.startsWith('user_')) {
        // 로컬 세션인 경우 기본값 반환 (Supabase 데이터 없음)
        setStats({
          totalHeight: 0,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
        setLoading(false);
        return;
      }

      const { data: records, error: queryError } = await supabase
        .from('game_records')
        .select('score, cleared, level, subject')
        .eq('user_id', user_id);

      if (queryError) {
        throw queryError;
      }

      if (!records || records.length === 0) {
        setStats({
          totalHeight: 0,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
        setLoading(false);
        return;
      }

      // 클라이언트에서 집계
      const totalHeight = records.reduce((sum, record) => sum + (record.score || 0), 0);
      const solvedRecords = records.filter(r => r.cleared === true);
      const totalSolved = solvedRecords.length;
      const maxLevel = solvedRecords.length > 0
        ? Math.max(...solvedRecords.map(r => r.level || 0))
        : 0;

      // 과목별 점수 합계 계산
      const subjectScores: Record<string, number> = {};
      records.forEach(record => {
        if (record.subject) {
          subjectScores[record.subject] = (subjectScores[record.subject] || 0) + (record.score || 0);
        }
      });

      const bestSubject = Object.keys(subjectScores).length > 0
        ? Object.entries(subjectScores).sort((a, b) => b[1] - a[1])[0][0]
        : null;

      setStats({
        totalHeight,
        totalSolved,
        maxLevel,
        bestSubject,
      });
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      setError(err instanceof Error ? err.message : '통계를 불러오는 중 오류가 발생했습니다.');
      // 에러 발생 시 기본값 설정
      setStats({
        totalHeight: 0,
        totalSolved: 0,
        maxLevel: 0,
        bestSubject: null,
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

