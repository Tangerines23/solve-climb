/**
 * Supabase API 통합 유틸리티
 * 모든 Supabase 호출을 중앙에서 관리하고 타입 안전성을 보장합니다.
 */

import { supabase } from './supabaseClient';
import { logError } from './errorHandler';
import { useLoadingStore } from '../stores/useLoadingStore';
import { ENV } from './env';
import type { Session } from '@supabase/supabase-js';

/**
 * 로딩 ID 생성 헬퍼
 */
function createLoadingId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 로딩 상태와 함께 비동기 작업 실행
 */
async function withLoading<T>(
  loadingId: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  const { startLoading, stopLoading } = useLoadingStore.getState();
  try {
    startLoading(loadingId);
    return await asyncFn();
  } finally {
    stopLoading(loadingId);
  }
}

/**
 * 게임 기록 및 사용자 통계 타입은 src/types/index.ts에서 import
 */
import type { GameRecord, UserStats } from '../types';

/**
 * 인증 API
 */
export const authApi = {
  /**
   * 현재 사용자 가져오기
   */
  async getCurrentUser() {
    const loadingId = createLoadingId('auth_getCurrentUser');
    return withLoading(loadingId, async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      } catch (error) {
        logError('Auth API - getCurrentUser', error);
        throw error;
      }
    });
  },

  /**
   * 현재 세션 가져오기
   */
  async getSession(): Promise<Session | null> {
    const loadingId = createLoadingId('auth_getSession');
    return withLoading(loadingId, async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
      } catch (error) {
        logError('Auth API - getSession', error);
        throw error;
      }
    });
  },

  /**
   * 로그아웃
   */
  async signOut() {
    const loadingId = createLoadingId('auth_signOut');
    return withLoading(loadingId, async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        logError('Auth API - signOut', error);
        throw error;
      }
    });
  },

  /**
   * 인증 상태 변경 리스너 등록
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },
};

/**
 * 게임 기록 API
 */
export const gameRecordsApi = {
  /**
   * 게임 기록 조회
   */
  async getRecords(userId: string) {
    const loadingId = createLoadingId('gameRecords_getRecords');
    return withLoading(loadingId, async () => {
      try {
        const { data, error } = await supabase
          .from('game_records')
          .select('score, cleared, level, subject')
          .eq('user_id', userId);

        if (error) throw error;
        return data || [];
      } catch (error) {
        logError('Game Records API - getRecords', error);
        throw error;
      }
    });
  },

  /**
   * 게임 기록 저장/업데이트
   */
  async upsertRecord(record: GameRecord) {
    const loadingId = createLoadingId('gameRecords_upsertRecord');
    return withLoading(loadingId, async () => {
      try {
        const { error } = await supabase
          .from('game_records')
          .upsert({
            ...record,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id, category, subject, level, mode',
            ignoreDuplicates: false,
          });

        if (error) throw error;
      } catch (error) {
        logError('Game Records API - upsertRecord', error);
        throw error;
      }
    });
  },

  /**
   * 사용자의 모든 게임 기록 삭제
   */
  async deleteAllRecords(userId: string) {
    const loadingId = createLoadingId('gameRecords_deleteAll');
    return withLoading(loadingId, async () => {
      try {
        const { error } = await supabase
          .from('game_records')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } catch (error) {
        logError('Game Records API - deleteAllRecords', error);
        throw error;
      }
    });
  },
};

/**
 * 통계 API
 */
export const statsApi = {
  /**
   * RPC를 통한 사용자 통계 가져오기
   */
  async getUserStatsRPC(): Promise<UserStats | null> {
    const loadingId = createLoadingId('stats_getUserStatsRPC');
    return withLoading(loadingId, async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_game_stats');
        
        if (error) throw error;
        if (!data || data.length === 0) return null;

        const result = data[0];
        return {
          totalHeight: result.total_height || 0,
          totalSolved: result.total_solved || 0,
          maxLevel: result.max_level || 0,
          bestSubject: result.best_subject || null,
        };
      } catch (error) {
        logError('Stats API - getUserStatsRPC', error);
        return null; // RPC가 없으면 null 반환 (폴백 사용)
      }
    });
  },

  /**
   * 직접 쿼리를 통한 사용자 통계 계산
   */
  async getUserStatsFromRecords(userId: string): Promise<UserStats> {
    const loadingId = createLoadingId('stats_getUserStatsFromRecords');
    return withLoading(loadingId, async () => {
      try {
        const records = await gameRecordsApi.getRecords(userId);

        if (!records || records.length === 0) {
          return {
            totalHeight: 0,
            totalSolved: 0,
            maxLevel: 0,
            bestSubject: null,
          };
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

        return {
          totalHeight,
          totalSolved,
          maxLevel,
          bestSubject,
        };
      } catch (error) {
        logError('Stats API - getUserStatsFromRecords', error);
        throw error;
      }
    });
  },

  /**
   * 사용자 통계 가져오기 (RPC 우선, 실패 시 직접 쿼리)
   */
  async getUserStats(userId: string): Promise<UserStats> {
    // 로컬 세션인 경우 기본값 반환
    if (userId.startsWith('user_')) {
      return {
        totalHeight: 0,
        totalSolved: 0,
        maxLevel: 0,
        bestSubject: null,
      };
    }

    // RPC 함수 시도
    const rpcStats = await statsApi.getUserStatsRPC();
    if (rpcStats) {
      return rpcStats;
    }

    // RPC가 없으면 직접 쿼리로 폴백
    return await statsApi.getUserStatsFromRecords(userId);
  },
};

/**
 * 오늘의 챌린지 API
 */
export const challengeApi = {
  /**
   * 오늘 날짜의 챌린지를 가져옵니다
   * @param date 날짜 문자열 (YYYY-MM-DD 형식, 생략 시 오늘 날짜)
   * @returns 오늘의 챌린지 또는 null
   */
  async getTodayChallenge(date?: string): Promise<{
    id: string;
    challenge_date: string;
    category_id: string;
    category_name: string;
    topic_id: string;
    topic_name: string;
    level: number;
    mode: string;
    title: string;
  } | null> {
    const loadingId = createLoadingId('challenge_getTodayChallenge');
    return withLoading(loadingId, async () => {
      try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        // .maybeSingle() 사용: 데이터가 없으면 null 반환 (406 에러 없음)
        const { data, error } = await supabase
          .from('today_challenges')
          .select('*')
          .eq('challenge_date', targetDate)
          .maybeSingle();

        if (error) {
          // PGRST116 = 데이터 없음 (정상적인 상황)
          if (error.code === 'PGRST116') {
            return null;
          }
          
          // 테이블이 없는 경우 (마이그레이션 필요)
          if (error.code === 'PGRST205' || error.code === 'PGRST301') {
            if (ENV.IS_DEVELOPMENT) {
              console.warn('[Challenge API] today_challenges 테이블이 존재하지 않습니다.');
            }
            return null;
          }
          
          // 기타 에러는 로깅 후 null 반환
          if (ENV.IS_DEVELOPMENT) {
            console.error('[Challenge API] today_challenges 조회 에러:', error);
          }
          logError('Challenge API - getTodayChallenge', error);
          return null;
        }

        return data;
      } catch (error) {
        logError('Challenge API - getTodayChallenge', error);
        return null;
      }
    });
  },
};

