// 레벨 진행 상태 관리 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabaseClient';
import { debugSupabaseQuery } from '../utils/debugFetch';
import { GameMode } from '../types/quiz';
import { useDebugStore } from './useDebugStore';
import type { UserResponse } from '@supabase/supabase-js';

export interface LevelRecord {
  level: number;
  cleared: boolean;
  bestScore: {
    'time-attack': number | null;
    survival: number | null;
    infinite: number | null;
  };
  clearedAt?: string;
}

export interface CategoryProgress {
  [category: string]: {
    [level: number]: LevelRecord;
  };
}

export interface UserProgress {
  [world: string]: CategoryProgress;
}

export interface RankingRecord {
  user_id: string;
  nickname: string;
  score: number;
  rank: number;
}

interface LevelProgressState {
  progress: UserProgress;
  rankings: { [key: string]: RankingRecord[] }; // category-mode key
  // ... existing
  getLevelProgress: (world: string, category: string) => LevelRecord[];
  isLevelCleared: (world: string, category: string, level: number) => boolean;
  getNextLevel: (world: string, category: string) => number;
  clearLevel: (
    world: string,
    category: string,
    level: number,
    mode: GameMode,
    score: number,
    sessionData?: {
      answers: number[];
      questionIds: string[];
      sessionId: string;
    }
  ) => void;
  updateBestScore: (
    world: string,
    category: string,
    level: number,
    mode: GameMode,
    score: number,
    sessionData?: {
      answers: number[];
      questionIds: string[];
      sessionId: string;
    }
  ) => void;
  getBestRecords: (
    world: string,
    category: string
  ) => {
    'time-attack': number | null;
    survival: number | null;
  };
  syncProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
  // Global Ranking v2
  fetchRanking: (
    world: string | null,
    category: string | null,
    period: 'weekly' | 'all-time',
    type: 'total' | 'time-attack' | 'survival' | 'infinite',
    limit?: number
  ) => Promise<void>;
}

const getDefaultLevelRecord = (level: number): LevelRecord => ({
  level,
  cleared: false,
  bestScore: {
    'time-attack': null,
    survival: null,
    infinite: null,
  },
});

export const useLevelProgressStore = create<LevelProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      rankings: {},

      getLevelProgress: (world, category) => {
        const state = get();
        const worldProgress = state.progress[world];
        if (!worldProgress || !worldProgress[category]) {
          return [];
        }
        return Object.values(worldProgress[category]).sort((a, b) => a.level - b.level);
      },

      isLevelCleared: (world, category, level) => {
        const state = get();
        if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) return true;
        return state.progress[world]?.[category]?.[level]?.cleared ?? false;
      },

      getNextLevel: (world, category) => {
        const state = get();
        const worldProgress = state.progress[world];

        if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) {
          return 999; // bypass 시에는 어떤 레벨이든 통과 가능하도록 큰 값 반환
        }

        if (!worldProgress || !worldProgress[category]) {
          return 1; // 첫 레벨부터 시작
        }

        const levels = Object.values(worldProgress[category])
          .filter((record) => record.cleared)
          .map((record) => record.level)
          .sort((a, b) => b - a);

        if (levels.length === 0) {
          return 1;
        }

        return levels[0] + 1; // 마지막 클리어 레벨 + 1
      },

      clearLevel: async (world, category, level, mode, score, sessionData) => {
        console.log('[useLevelProgressStore] clearLevel called:', {
          world,
          category,
          level,
          mode,
          score,
          hasSessionData: !!sessionData,
        });

        // 1. Optimistic Update (Local) - Move to the beginning to be truly synchronous for UI/Tests
        set((state) => {
          const newProgress = { ...state.progress };

          if (!newProgress[world]) newProgress[world] = {};
          if (!newProgress[world][category]) newProgress[world][category] = {};
          if (!newProgress[world][category][level]) {
            newProgress[world][category][level] = getDefaultLevelRecord(level);
          }

          const record = newProgress[world][category][level];
          record.cleared = true;
          record.clearedAt = new Date().toISOString();

          if (
            (mode === 'time-attack' || mode === 'survival') &&
            (record.bestScore[mode] === null || score > record.bestScore[mode]!)
          ) {
            record.bestScore[mode] = score;
          }

          return { progress: newProgress };
        });

        const authResult = (await debugSupabaseQuery(supabase.auth.getUser())) as UserResponse;
        const user = authResult?.data?.user;
        console.log('[useLevelProgressStore] Current user:', user?.id);

        if (!user) {
          console.warn('[useLevelProgressStore] No user found, skipping Supabase sync');
          return;
        }

        // 2. Call submit_game_result RPC to update weekly scores and log activity
        try {
          const gameMode =
            mode === 'time-attack' ? 'timeattack' : mode === 'survival' ? 'survival' : 'infinite';
          console.log('[clearLevel] Calling submit_game_result RPC:', { score, gameMode });

          const { error: rpcError } = await debugSupabaseQuery(
            supabase.rpc('submit_game_result', {
              p_user_answers: sessionData?.answers || [],
              p_question_ids: sessionData?.questionIds || [],
              p_game_mode: gameMode,
              p_items_used: null,
              p_session_id: sessionData?.sessionId,
              p_category: 'math', // TODO: Map world to category correctly
              p_subject: 'add', // TODO: Map category to subject correctly
              p_level: level,
            })
          );

          if (rpcError) {
            console.error('[clearLevel] submit_game_result RPC failed:', rpcError);
          } else {
            console.log('[clearLevel] Weekly score updated successfully via RPC');
          }
        } catch (error) {
          console.error('[clearLevel] Failed to call submit_game_result:', error);
        }
      },

      updateBestScore: async (world, category, level, mode, score, sessionData) => {
        // 1. Optimistic Update (Local)
        set((state) => {
          const newProgress = { ...state.progress };

          if (!newProgress[world]) newProgress[world] = {};
          if (!newProgress[world][category]) newProgress[world][category] = {};
          if (!newProgress[world][category][level]) {
            newProgress[world][category][level] = getDefaultLevelRecord(level);
          }

          const record = newProgress[world][category][level];
          if (
            (mode === 'time-attack' || mode === 'survival' || mode === 'infinite') &&
            (record.bestScore[mode] === null || score > record.bestScore[mode]!)
          ) {
            record.bestScore[mode] = score;
          }

          return { progress: newProgress };
        });

        // 2. Call submit_game_result RPC to update weekly scores
        try {
          const gameMode =
            mode === 'time-attack' ? 'timeattack' : mode === 'survival' ? 'survival' : 'infinite';
          const { error: rpcError } = await debugSupabaseQuery(
            supabase.rpc('submit_game_result', {
              p_user_answers: sessionData?.answers || [],
              p_question_ids: sessionData?.questionIds || [],
              p_game_mode: gameMode,
              p_items_used: null,
              p_session_id: sessionData?.sessionId,
              p_category: 'math',
              p_subject: 'add',
              p_level: level,
            })
          );

          if (rpcError) {
            console.error('[updateBestScore] submit_game_result RPC failed:', rpcError);
          }
        } catch (error) {
          console.error('[updateBestScore] Failed to call submit_game_result:', error);
        }
      },

      getBestRecords: (world, category) => {
        const state = get();
        const worldProgress = state.progress[world];
        if (!worldProgress || !worldProgress[category]) {
          return { 'time-attack': null, survival: null };
        }

        const records = Object.values(worldProgress[category]);
        let bestTimeAttack: number | null = null;
        let bestSurvival: number | null = null;

        records.forEach((record) => {
          if (record.bestScore['time-attack'] !== null) {
            if (bestTimeAttack === null || record.bestScore['time-attack']! > bestTimeAttack) {
              bestTimeAttack = record.bestScore['time-attack']!;
            }
          }
          if (record.bestScore['survival'] !== null) {
            if (bestSurvival === null || record.bestScore['survival']! > bestSurvival) {
              bestSurvival = record.bestScore['survival']!;
            }
          }
          if (record.bestScore['infinite'] !== null) {
            // Infinite mode typically tracks the highest altitude, which we map to survival or its own
            // For now, let's keep it separate if needed, or if survival best should be updated
          }
        });

        return {
          'time-attack': bestTimeAttack,
          survival: bestSurvival,
          infinite: records.reduce(
            (max, r) =>
              r.bestScore.infinite && r.bestScore.infinite > (max || 0)
                ? r.bestScore.infinite
                : max,
            null as number | null
          ),
        };
      },

      syncProgress: async () => {
        try {
          const authResult = await debugSupabaseQuery(supabase.auth.getUser());
          const user = authResult?.data?.user;
          if (!user) return;

          const { data: records, error } = await debugSupabaseQuery(
            supabase.from('game_records').select('*').eq('user_id', user.id)
          );

          if (error) throw error;

          if (records) {
            set((state) => {
              const newProgress = { ...state.progress };

              records.forEach((serverRecord) => {
                const {
                  category: world,
                  subject: category,
                  level,
                  mode,
                  score,
                  cleared,
                  cleared_at,
                } = serverRecord;

                if (!newProgress[world]) newProgress[world] = {};
                if (!newProgress[world][category]) newProgress[world][category] = {};
                if (!newProgress[world][category][level]) {
                  newProgress[world][category][level] = getDefaultLevelRecord(level);
                }

                const localRecord = newProgress[world][category][level];

                // Merge logic: Server wins if data exists
                if (cleared) {
                  localRecord.cleared = true;
                  localRecord.clearedAt = cleared_at || localRecord.clearedAt;
                }

                const modeKey = mode as GameMode;
                if (modeKey === 'time-attack' || modeKey === 'survival' || modeKey === 'infinite') {
                  if (
                    localRecord.bestScore[modeKey] === null ||
                    score > localRecord.bestScore[modeKey]!
                  ) {
                    localRecord.bestScore[modeKey] = score;
                  }
                }
              });

              return { progress: newProgress };
            });
          }
        } catch (error) {
          console.error('Failed to sync progress from Supabase:', error);
        }
      },

      resetProgress: async () => {
        // 1. Local State 리셋
        set({ progress: {} });

        // 2. Supabase에서도 삭제
        try {
          const authResult = await debugSupabaseQuery(supabase.auth.getUser());
          const user = authResult?.data?.user;
          if (!user) return;

          const { error } = await debugSupabaseQuery(
            supabase.from('game_records').delete().eq('user_id', user.id)
          );

          if (error) throw error;
        } catch (error) {
          console.error('Failed to reset progress in Supabase:', error);
          // 에러가 발생해도 로컬은 이미 리셋되었으므로 계속 진행
        }
      },

      fetchRanking: async (world, category, period, type, limit = 50) => {
        try {
          // Note: RPC function signature requires p_category
          const { data, error } = await debugSupabaseQuery(
            supabase.rpc('get_ranking_v2', {
              p_category: world,
              p_period: period,
              p_type: type,
              p_limit: limit,
            })
          );

          if (error) throw error;

          if (data) {
            const key =
              world && category ? `${world}-${category}-${period}-${type}` : `${period}-${type}`;

            set((state) => ({
              rankings: {
                ...state.rankings,
                [key]: data as RankingRecord[],
              },
            }));
          }
        } catch (error) {
          console.error('Failed to fetch ranking v2:', error);
        }
      },
    }),
    {
      name: 'solve-climb-level-progress',
    }
  )
);
