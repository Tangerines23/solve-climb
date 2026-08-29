import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';

export interface DBProgressRecord {
  id?: string;
  user_id?: string;
  world_id?: string;
  category_id?: string;
  subject_id?: string;
  level: number;
  mode_code?: number;
  best_score?: number;
  cleared?: boolean;
  updated_at?: string;
}

/**
 * 레벨 진행도 데이터베이스 저장소 (ProgressRepository)
 * - Supabase user_levels / user_level_records 테이블과의 API 통신 및 쿼리를 전담합니다.
 * - useLevelProgressStore 스토어에서 직접 DB 조회를 제거하기 위해 분리되었습니다.
 */
export class ProgressRepository {
  /**
   * 서버로부터 유저의 전체 진행도 데이터를 조회합니다.
   */
  static async fetchServerProgress(userId: string): Promise<{
    data: DBProgressRecord[] | null;
    error: unknown;
  }> {
    const { data, error } = await safeSupabaseQuery(
      supabase
        .from('user_level_records')
        .select('world_id, category_id, subject_id, level, mode_code, best_score, updated_at')
        .eq('user_id', userId),
      { context: 'ProgressRepository.fetchServerProgress' }
    );

    return { data: data as DBProgressRecord[] | null, error };
  }

  /**
   * 서버에 유저 진행도를 초기화(삭제)합니다.
   */
  static async resetServerProgress(userId: string): Promise<{ success: boolean; error?: unknown }> {
    const { error } = await safeSupabaseQuery(
      supabase.from('user_level_records').delete().eq('user_id', userId),
      { context: 'ProgressRepository.resetServerProgress' }
    );

    if (error) {
      return { success: false, error };
    }
    return { success: true };
  }
}
