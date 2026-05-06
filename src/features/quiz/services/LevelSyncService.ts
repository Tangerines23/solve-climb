import { supabase } from '../../../utils/supabaseClient';
import { safeSupabaseQuery } from '../../../utils/debugFetch';
import { GameMode, Tier } from '../types/quiz';
import { UserResponse } from '@supabase/supabase-js';

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
    sessionData?: {
      answers: number[];
      questionIds: string[];
      sessionId: string;
    };
    tier?: Tier;
    subject?: string;
  }): Promise<LevelSyncResult> {
    const { category, level, mode, avgSolveTime = 0, sessionData, subject = 'add' } = params;

    try {
      const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
      const user = authResult?.data?.user;

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
          p_category: category,
          p_subject: subject,
          p_level: level,
          p_avg_solve_time: avgSolveTime,
        })
      );

      if (rpcError || !rpcData?.success) {
        const errorMsg =
          rpcData?.error || '게임 결과 저장에 실패했습니다. (보안 위반 또는 세션 만료)';
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error) {
      console.error('[LevelSyncService] Unexpected error:', error);
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
