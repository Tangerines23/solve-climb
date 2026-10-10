// src/features/mypage/hooks/useHistoryData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { storageService, STORAGE_KEYS } from '@/services';
import { useAuthStore } from '@/stores/useAuthStore';
import { logError } from '@/utils/errorHandler';
import { ANONYMOUS_USER_TITLE } from '@/constants/history';
import {
  type HistoryStats,
  getEmptyStats,
  calculateLocalStats,
  calculateAuthenticatedStats,
  type DbLevelRecord,
  type DbProfile,
  type SessionRow,
  type LocalHistoryRecord,
} from '@/features/mypage/utils/historyStatsCalculator';

export type { HistoryStats };

export function useHistoryData() {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const authSession = useAuthStore((state) => state.session);
  const authUser = useAuthStore((state) => state.user);

  const fetchHistoryData = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const user = authSession?.user || authUser;
      const currentUserId = user?.id;

      if (!user || !currentUserId) {
        try {
          const localHistory = storageService.get<LocalHistoryRecord[]>(STORAGE_KEYS.LOCAL_HISTORY);
          if (localHistory && Array.isArray(localHistory) && localHistory.length > 0) {
            const localStats = calculateLocalStats(localHistory, ANONYMOUS_USER_TITLE);
            if (isMountedRef.current) {
              setStats(localStats);
              setLoading(false);
            }
            return;
          }
        } catch (e) {
          console.warn('Failed to load local history:', e);
        }

        if (isMountedRef.current) {
          setStats(getEmptyStats(ANONYMOUS_USER_TITLE));
          setLoading(false);
        }
        return;
      }

      const [recordsRes, sessionsRes, profileRes] = await Promise.all([
        safeSupabaseQuery(
          supabase
            .from('user_level_records')
            .select('world_id, category_id, subject_id, level, mode_code, best_score, updated_at')
            .eq('user_id', currentUserId)
            .order('updated_at', { ascending: false })
        ),
        safeSupabaseQuery(
          supabase
            .from('game_sessions')
            .select('category, subject, level, game_mode, score, created_at')
            .eq('user_id', currentUserId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(50)
        ),
        safeSupabaseQuery(
          supabase
            .from('profiles')
            .select('total_mastery_score, login_streak')
            .eq('id', currentUserId)
            .maybeSingle()
        ),
      ] as const);

      if (recordsRes.error) throw recordsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      const finalStats = calculateAuthenticatedStats({
        recordsData: recordsRes.data as DbLevelRecord[] | null,
        sessionsData: sessionsRes.data as SessionRow[] | null,
        profileData: profileRes.data as unknown as DbProfile | null,
      });

      if (isMountedRef.current) {
        setStats(finalStats);
      }
    } catch (err: unknown) {
      logError('useHistoryData#fetchHistoryData', err);
      if (isMountedRef.current) {
        setError((err as Error).message || '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [authSession, authUser]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchHistoryData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchHistoryData]);

  return { stats, loading, error, refetch: fetchHistoryData };
}
