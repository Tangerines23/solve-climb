// 레벨 진행 상태 관리 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery, useDebugStore } from '@/features/debug';
import { validatedRpc, RankingListSchema } from '@/utils/rpcValidator';
import type { GameMode, Tier } from '../types/quiz';
import { useToastStore } from '@/stores/useToastStore';
import { UI_MESSAGES } from '@/constants/ui';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { LevelSyncService } from '../services/LevelSyncService';

import { LevelRecord, UserProgress, RankingRecord } from '../types/progress';
import { STATUS } from '@/constants/status';
export { type UserProgress };

export interface LevelProgressState {
  records: Record<string, LevelRecord>;
  progress: UserProgress; // Backward compatibility
  rankings: { [key: string]: RankingRecord[] };
  rankingVersion: number;
  _rankingSubscription: RealtimeChannel | null;

  getLevelProgress: (world: string, category: string, tier?: Tier) => LevelRecord[];
  isLevelCleared: (world: string, category: string, level: number, tier?: Tier) => boolean;
  getNextLevel: (world: string, category: string, tier?: Tier) => number;
  clearLevel: (
    world: string,
    category: string,
    level: number,
    mode: GameMode,
    score: number,
    avgSolveTime?: number,
    sessionData?: any,
    tier?: Tier
  ) => Promise<void>;
  updateBestScore: (
    world: string,
    category: string,
    level: number,
    mode: GameMode,
    score: number,
    avgSolveTime?: number,
    sessionData?: any,
    tier?: Tier
  ) => Promise<void>;
  getBestRecords: (
    world: string,
    category: string,
    tier?: Tier
  ) => {
    'time-attack': number | null;
    survival: number | null;
    infinite: number | null;
  };
  syncProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
  fetchRanking: (
    world: string | null,
    category: string | null,
    period: 'weekly' | 'all-time',
    type: 'total' | 'time-attack' | 'survival' | 'infinite',
    limit?: number
  ) => Promise<void>;
  subscribeToRankingUpdates: () => void;
  unsubscribeFromRankingUpdates: () => void;
}

const getRecordKey = (world: string, category: string, level: number, tier: Tier = 'normal') =>
  `${tier}:${world}:${category}:${level}`;

const reconstructProgress = (records: Record<string, LevelRecord>): UserProgress => {
  const progress: UserProgress = {};
  Object.entries(records).forEach(([key, record]) => {
    const parts = key.split(':');
    if (parts.length < 4) return;
    const [tier, world, category, levelStr] = parts;
    const level = parseInt(levelStr, 10);
    const worldKey = tier === 'hard' ? `${world}_hard` : world;

    if (!progress[worldKey]) progress[worldKey] = {};
    if (!progress[worldKey][category]) progress[worldKey][category] = {};
    progress[worldKey][category][level] = record;
  });
  return progress;
};

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
      records: {},
      progress: {},
      rankings: {},
      rankingVersion: 0,
      _rankingSubscription: null,

      getLevelProgress: (world, category, tier = 'normal') => {
        const { records } = get();
        return Object.entries(records)
          .filter(([key]) => key.startsWith(`${tier}:${world}:${category}:`))
          .map(([, record]) => record)
          .sort((a, b) => a.level - b.level);
      },

      isLevelCleared: (world, category, level, tier = 'normal') => {
        if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) return true;
        const key = getRecordKey(world, category, level, tier);
        return get().records[key]?.cleared ?? false;
      },

      getNextLevel: (world, category, tier = 'normal') => {
        if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) return 999;
        const { records } = get();
        const clearedLevels = Object.entries(records)
          .filter(
            ([key, record]) => key.startsWith(`${tier}:${world}:${category}:`) && record.cleared
          )
          .map(([, record]) => record.level)
          .sort((a, b) => b - a);

        return clearedLevels.length === 0 ? 1 : clearedLevels[0] + 1;
      },

      clearLevel: async (
        world,
        category,
        level,
        mode,
        score,
        avgSolveTime,
        sessionData,
        tier = 'normal'
      ) => {
        const key = getRecordKey(world, category, level, tier);
        const previousRecords = { ...get().records };

        set((state) => {
          const record = state.records[key] || getDefaultLevelRecord(level);
          const updatedRecord = {
            ...record,
            cleared: true,
            clearedAt: new Date().toISOString(),
          };

          if (
            (mode === 'time-attack' || mode === 'survival') &&
            (updatedRecord.bestScore[mode] === null || score > updatedRecord.bestScore[mode]!)
          ) {
            updatedRecord.bestScore[mode] = score;
          }

          const newRecords = { ...state.records, [key]: updatedRecord };
          return {
            records: newRecords,
            progress: reconstructProgress(newRecords),
          };
        });

        const result = await LevelSyncService.submitGameResult({
          category,
          level,
          mode,
          score,
          avgSolveTime,
          sessionData,
          tier,
        });

        if (!result.success) {
          set({
            records: previousRecords,
            progress: reconstructProgress(previousRecords),
          });
          if (result.error !== 'No user found') {
            useToastStore.getState().showToast(result.error || '저장 실패', STATUS.ERROR);
          }
        }
      },

      updateBestScore: async (
        world,
        category,
        level,
        mode,
        score,
        avgSolveTime,
        sessionData,
        tier = 'normal'
      ) => {
        const key = getRecordKey(world, category, level, tier);
        const previousRecords = { ...get().records };

        set((state) => {
          const record = state.records[key] || getDefaultLevelRecord(level);
          if (
            (mode === 'time-attack' || mode === 'survival' || mode === 'infinite') &&
            (record.bestScore[mode] === null || score > record.bestScore[mode]!)
          ) {
            const updatedRecord = {
              ...record,
              bestScore: { ...record.bestScore, [mode]: score },
            };
            const newRecords = { ...state.records, [key]: updatedRecord };
            return {
              records: newRecords,
              progress: reconstructProgress(newRecords),
            };
          }
          return state;
        });

        const result = await LevelSyncService.submitGameResult({
          category,
          level,
          mode,
          score,
          avgSolveTime,
          sessionData,
          tier,
        });

        if (!result.success) {
          set({
            records: previousRecords,
            progress: reconstructProgress(previousRecords),
          });
        }
      },

      getBestRecords: (world, category, tier = 'normal') => {
        const { records } = get();
        const worldRecords = Object.entries(records)
          .filter(([key]) => key.startsWith(`${tier}:${world}:${category}:`))
          .map(([, record]) => record);

        const bests = {
          'time-attack': null as number | null,
          survival: null as number | null,
          infinite: null as number | null,
        };

        worldRecords.forEach((r) => {
          (['time-attack', 'survival', 'infinite'] as const).forEach((mode) => {
            const score = r.bestScore[mode];
            if (score !== null && (bests[mode] === null || score > bests[mode]!)) {
              bests[mode] = score;
            }
          });
        });

        return bests;
      },

      syncProgress: async () => {
        try {
          const authResult = await safeSupabaseQuery(supabase.auth.getUser());
          const user = authResult?.data?.user;
          if (!user) return;

          const { data: serverRecords, error } = await safeSupabaseQuery(
            supabase
              .from('user_level_records')
              .select('world_id, category_id, subject_id, level, mode_code, best_score, updated_at')
              .eq('user_id', user.id)
          );

          if (error) throw error;

          if (serverRecords) {
            set((state) => {
              const newRecords = { ...state.records };
              serverRecords.forEach((sr: any) => {
                const tier: Tier = sr.world_id.endsWith('_hard') ? 'hard' : 'normal';
                const world = sr.world_id.replace('_hard', '');
                const category = sr.subject_id
                  ? `${sr.category_id}_${sr.subject_id}`
                  : sr.category_id;
                const key = getRecordKey(world, category, sr.level, tier);

                const localRecord = newRecords[key] || getDefaultLevelRecord(sr.level);

                if (sr.best_score > 0) {
                  localRecord.cleared = true;
                  localRecord.clearedAt = sr.updated_at || localRecord.clearedAt;
                }

                const modeKey = sr.mode_code === 1 ? 'time-attack' : 'survival';
                if (
                  localRecord.bestScore[modeKey] === null ||
                  sr.best_score > localRecord.bestScore[modeKey]!
                ) {
                  localRecord.bestScore[modeKey] = sr.best_score;
                }

                newRecords[key] = localRecord;
              });
              return {
                records: newRecords,
                progress: reconstructProgress(newRecords),
              };
            });
          }
        } catch (error) {
          console.error('Sync failed:', error);
          useToastStore.getState().showToast(UI_MESSAGES.FETCH_DATA_FAILED, STATUS.ERROR);
        }
      },

      resetProgress: async () => {
        const result = await LevelSyncService.resetProgress();
        if (!result.success) {
          useToastStore
            .getState()
            .showToast(result.error || UI_MESSAGES.COMMON_ERROR, STATUS.ERROR);
          return;
        }
        set({ records: {}, progress: {} });
        useToastStore.getState().showToast('진행 상태가 초기화되었습니다.', STATUS.SUCCESS);
      },

      fetchRanking: async (world, category, period, type, limit = 50) => {
        try {
          let data: RankingRecord[] | null = null;
          let error: unknown = null;

          if (period === 'all-time') {
            const { data: hofData, error: hofError } = await safeSupabaseQuery(
              supabase
                .from('hall_of_fame')
                .select('user_id, nickname, score, rank, week_start_date, tier_level, tier_stars')
                .eq('mode', type)
                .order('week_start_date', { ascending: false })
                .order('rank', { ascending: true })
                .limit(limit)
            );
            data = hofData;
            error = hofError;
          } else {
            const { data: rankData, error: rankError } = await validatedRpc(
              supabase.rpc('get_ranking_v2', {
                p_category: category || 'all',
                p_limit: limit,
                p_period: period,
                p_type: type,
              }),
              RankingListSchema,
              'get_ranking_v2'
            );
            data = rankData;
            error = rankError;
          }

          if (error) throw error;

          if (data && Array.isArray(data)) {
            const key =
              world && category ? `${world}-${category}-${period}-${type}` : `${period}-${type}`;
            set((state) => ({
              rankings: { ...state.rankings, [key]: data! },
            }));
          }
        } catch (error) {
          console.error('Failed to fetch ranking:', error);
          useToastStore.getState().showToast(UI_MESSAGES.RANKING_FETCH_FAILED, STATUS.ERROR);
        }
      },

      subscribeToRankingUpdates: () => {
        const state = get();
        if (state._rankingSubscription) return;

        const channel = supabase
          .channel('ranking-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: 'weekly_score_total=gt.0',
            },
            () => {
              set((state) => ({ rankingVersion: (state.rankingVersion || 0) + 1 }));
            }
          )
          .subscribe();

        set({ _rankingSubscription: channel });
      },

      unsubscribeFromRankingUpdates: () => {
        const state = get();
        if (state._rankingSubscription) {
          state._rankingSubscription.unsubscribe();
          set({ _rankingSubscription: null });
        }
      },
    }),
    {
      name: 'solve-climb-level-progress-v2',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || (persistedState && !persistedState.records)) {
          const oldProgress = persistedState.progress || {};
          const newRecords: Record<string, LevelRecord> = {};

          Object.entries(oldProgress).forEach(([worldKey, categories]: [string, any]) => {
            const tier: Tier = worldKey.endsWith('_hard') ? 'hard' : 'normal';
            const world = worldKey.replace('_hard', '');

            Object.entries(categories).forEach(([category, levels]: [string, any]) => {
              Object.entries(levels).forEach(([level, record]: [string, any]) => {
                const key = `${tier}:${world}:${category}:${level}`;
                newRecords[key] = record;
              });
            });
          });
          return {
            ...persistedState,
            records: newRecords,
            progress: reconstructProgress(newRecords),
          };
        }

        // Ensure progress is always reconstructed even if already migrated
        if (persistedState && persistedState.records && !persistedState.progress) {
          return {
            ...persistedState,
            progress: reconstructProgress(persistedState.records),
          };
        }

        return persistedState;
      },
      partialize: (state) => ({
        records: state.records,
        rankings: state.rankings,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'solve-climb-level-progress-v2') {
      useLevelProgressStore.persist.rehydrate();
    }
  });
}
