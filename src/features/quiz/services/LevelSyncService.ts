import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { GameMode, Tier } from '../types/quiz';
import { UserResponse } from '@supabase/supabase-js';
import { logError } from '@/utils/errorHandler';

export interface LevelSyncResult {
  success: boolean;
  error?: string;
}

/**
 * 레벨 진행 데이터 서버 동기화 서비스
 */
export class LevelSyncService {
  /**
   * Supabase RPC를 호출하여 게임 결과를 서버에 저장
   */
  static async submitGameResult(params: {
    category: string;
    level: number;
    mode: GameMode;
    score: number;
    avgSolveTime?: number;
    subject?: string;
    sessionData?: {
      answers: number[];
      questionIds: string[];
      sessionId: string;
    };
    tier?: Tier;
  }): Promise<LevelSyncResult> {
    const {
      category: rawCategory,
      level,
      mode,
      avgSolveTime = 0,
      sessionData,
      subject: rawSubject,
    } = params;

    let rpcCategory = rawCategory;
    let rpcSubject = rawSubject || 'add';

    if (rawCategory.includes('_')) {
      const parts = rawCategory.split('_');
      if (parts[0] === 'arithmetic') {
        rpcCategory = 'math';
        const subMap: Record<string, string> = {
          addition: 'add',
          subtraction: 'sub',
          multiplication: 'mul',
          division: 'div',
        };
        rpcSubject = subMap[parts[1]] || parts[1];
      } else {
        rpcCategory = parts[0];
        rpcSubject = parts.slice(1).join('_');
      }
    } else if (rawSubject) {
      rpcSubject = rawSubject;
    }

    try {
      const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
      let user = authResult?.data?.user;

      if (!user) {
        try {
          const { useAuthStore } = await import('@/stores/useAuthStore');
          await useAuthStore.getState().signInAnonymously();
          const retryAuth = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
          user = retryAuth?.data?.user;
        } catch (authErr) {
          logError('LevelSyncService#autoSignIn', authErr);
        }
      }

      if (!user) {
        return { success: false, error: 'No user found' };
      }

      const gameMode =
        mode === 'time-attack' ? 'timeattack' : mode === 'survival' ? 'survival' : 'infinite';

      const { data: rpcData, error: rpcError } = await safeSupabaseQuery(
        supabase.rpc('submit_game_result', {
          p_user_answers: sessionData?.answers ?? [],
          p_question_ids: (sessionData?.questionIds ?? []).map(String),
          p_game_mode: gameMode,
          p_items_used: [],
          p_session_id: sessionData?.sessionId ?? null,
          p_category: rpcCategory,
          p_subject: rpcSubject,
          p_level: level,
          p_avg_solve_time: avgSolveTime,
        })
      );

      if (rpcError || !rpcData?.success) {
        console.error('[LevelSyncService] submit_game_result 실패 상세 정보:', {
          rpcError,
          rpcData,
          params: {
            p_user_answers: sessionData?.answers ?? [],
            p_question_ids: (sessionData?.questionIds ?? []).map(String),
            p_game_mode: gameMode,
            p_items_used: [],
            p_session_id: sessionData?.sessionId ?? null,
            p_category: rpcCategory,
            p_subject: rpcSubject,
            p_level: level,
            p_avg_solve_time: avgSolveTime,
          },
        });
        const errorMsg =
          rpcData?.error ||
          rpcError?.message ||
          '게임 결과 저장에 실패했습니다. (보안 위반 또는 세션 만료)';
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error) {
      logError('LevelSyncService#submitGameResult', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 전체 진행 상황 초기화 (디버그용)
   */
  static async resetProgress(): Promise<LevelSyncResult> {
    try {
      const { data, error } = await safeSupabaseQuery(supabase.rpc('reset_user_progress'));
      if (error || !data?.success) {
        return { success: false, error: error?.message || '초기화 실패' };
      }
      return { success: true };
    } catch {
      return { success: false, error: '서버 연결 실패' };
    }
  }
}
