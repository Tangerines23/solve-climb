// 레벨 진행 상태 관리 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { validatedRpc, RankingListSchema } from '@/utils/rpcValidator';
import type { GameMode, Tier } from '../types/quiz';
import { useDebugStore } from '@/stores/useDebugStore';
import { useToastStore } from '@/stores/useToastStore';
import { UI_MESSAGES } from '@/constants/ui';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { safeAccess } from '@/utils/validation';
import { LevelSyncService } from '@/services/LevelSyncService';

import {
  LevelRecord,
  UserProgress,
  RankingRecord,
} from '../types/progress';
export { type UserProgress };

interface LevelProgressState {
  progress: UserProgress;
  rankings: { [key: string]: RankingRecord[] };
  rankingVersion: number; // For triggering re-renders on realtime updates
  _rankingSubscription: RealtimeChannel | null; // Internal subscription reference

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
    sessionData?: {
      answers: number[];
      questionIds: string[];
      sessionId: string;
    },
    tier?: Tier
  ) => void;
  updateBestScore: (
    world: string,
    category: string,
    level: number,
    mode: GameMode,
    score: number,
    avgSolveTime?: number,
    sessionData?: {
      answers: number[];
      questionIds: string[];
      sessionId: string;
    },
    tier?: Tier
  ) => void;
  getBestRecords: (
    world: string,
    category: string,
    tier?: Tier
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
  subscribeToRankingUpdates: () => void;
  unsubscribeFromRankingUpdates: () => void;
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
    (set, get) => {
      /* eslint-disable security/detect-object-injection -- progress/rankings keys (world, category, level, mode) are validated store params */
      return {
        progress: {},
        rankings: {},
        rankingVersion: 0,
        _rankingSubscription: null,

        getLevelProgress: (world, category, tier = 'normal') => {
          const state = get();
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          const worldProgress = state.progress[worldKey];
          if (!worldProgress || !worldProgress[category]) {
            return [];
          }
          return (Object.values(worldProgress[category]) as LevelRecord[]).sort((a, b) => a.level - b.level);
        },

        isLevelCleared: (world, category, level, tier = 'normal') => {
          const state = get();
          if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) return true;
          const worldKey = tier === 'hard' ? `${world}_hard` : world;

          const worldProgress = safeAccess(state.progress, worldKey) as
            | Record<string, unknown>
            | undefined;
          const categoryProgress = safeAccess(worldProgress, category) as
            | Record<number, LevelRecord>
            | undefined;
          const levelRecord = safeAccess(categoryProgress, level) as LevelRecord | undefined;

          return levelRecord?.cleared ?? false;
        },

        getNextLevel: (world, category, tier = 'normal') => {
          const state = get();
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          const worldProgress = safeAccess(state.progress, worldKey) as
            | Record<string, unknown>
            | undefined;

          if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) {
            return 999; // bypass 시에는 어떤 레벨이든 통과 가능하도록 큰 값 반환
          }

          const categoryProgress = safeAccess(worldProgress, category) as
            | Record<number, LevelRecord>
            | undefined;
          if (!worldProgress || !categoryProgress) {
            return 1; // 첫 레벨부터 시작
          }

          const levels = Object.values(categoryProgress)
            .filter((record) => record.cleared)
            .map((record) => record.level)
            .sort((a, b) => b - a);

          if (levels.length === 0) {
            return 1;
          }

          return levels[0] + 1; // 마지막 클리어 레벨 + 1
        },

        clearLevel: async (
          world,
          category,
          level,
          mode,
          score,
          avgSolveTime = 0,
          sessionData,
          tier = 'normal'
        ) => {
          const worldKey = tier === 'hard' ? `${world}_hard` : world;

          // 1. Save current state for potential rollback
          const previousProgress = JSON.parse(JSON.stringify(get().progress));

          // 2. Optimistic Update (Local)
          set((state) => {
            const worldProgress = state.progress[worldKey] || {};
            const categoryProgress = worldProgress[category] || {};
            const levelRecord = categoryProgress[level] || getDefaultLevelRecord(level);

            const updatedRecord = {
              ...levelRecord,
              cleared: true,
              clearedAt: new Date().toISOString(),
            };

            if (
              (mode === 'time-attack' || mode === 'survival') &&
              (updatedRecord.bestScore[mode] === null || score > updatedRecord.bestScore[mode]!)
            ) {
              updatedRecord.bestScore[mode] = score;
            }

            return {
              progress: {
                ...state.progress,
                [worldKey]: {
                  ...worldProgress,
                  [category]: {
                    ...categoryProgress,
                    [level]: updatedRecord,
                  },
                },
              },
            };
          });

          // 3. Call Service for Server Sync
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
            console.error('[clearLevel] Sync failed, rolling back:', result.error);
            set({ progress: previousProgress });
            if (result.error !== 'No user found') {
              useToastStore.getState().showToast(result.error || '저장 실패', 'error');
            }
          }
        },

        updateBestScore: async (
          world,
          category,
          level,
          mode,
          score,
          avgSolveTime = 0,
          sessionData,
          tier = 'normal'
        ) => {
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          // 1. Save state for rollback
          const previousProgress = JSON.parse(JSON.stringify(get().progress));

          // 2. Optimistic Update (Local)
          set((state) => {
            const newProgress = { ...state.progress };

            if (!newProgress[worldKey]) newProgress[worldKey] = {};
            if (!newProgress[worldKey][category]) newProgress[worldKey][category] = {};
            if (!newProgress[worldKey][category][level]) {
              newProgress[worldKey][category][level] = getDefaultLevelRecord(level);
            }

            const record = newProgress[worldKey][category][level];
            if (
              (mode === 'time-attack' || mode === 'survival' || mode === 'infinite') &&
              (record.bestScore[mode] === null || score > record.bestScore[mode]!)
            ) {
              record.bestScore[mode] = score;
            }

            return { progress: newProgress };
          });

          // 3. Call Service for Server Sync
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
            console.error('[updateBestScore] Sync failed, rolling back:', result.error);
            set({ progress: previousProgress });
          }
        },

        getBestRecords: (world, category, tier = 'normal') => {
          const state = get();
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          const worldProgress = state.progress[worldKey];
          if (!worldProgress || !worldProgress[category]) {
            return { 'time-attack': null, survival: null };
          }

          const records = Object.values(worldProgress[category]) as LevelRecord[];
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
            const authResult = await safeSupabaseQuery(supabase.auth.getUser());
            const user = authResult?.data?.user;
            if (!user) return;

            const { data: records, error } = await safeSupabaseQuery(
              supabase
                .from('user_level_records')
                .select(
                  'world_id, category_id, subject_id, level, mode_code, best_score, updated_at'
                )
                .eq('user_id', user.id)
            );

            if (error) throw error;

            if (records) {
              set((state) => {
                const newProgress = { ...state.progress };

                records.forEach((serverRecord) => {
                  const {
                    world_id: world,
                    category_id,
                    subject_id,
                    level,
                    mode_code,
                    best_score: score,
                    updated_at,
                  } = serverRecord;

                  // local store key: category is `${category_id}_${subject_id}` or just one of them?
                  // Based on previous code: subject was used as category key.
                  const category = `${category_id}_${subject_id}`;

                  if (!newProgress[world]) newProgress[world] = {};
                  if (!newProgress[world][category]) newProgress[world][category] = {};
                  if (!newProgress[world][category][level]) {
                    newProgress[world][category][level] = getDefaultLevelRecord(level);
                  }

                  const localRecord = newProgress[world][category][level];

                  // Merge logic: Best score and cleared status
                  if (score > 0) {
                    localRecord.cleared = true;
                    localRecord.clearedAt = updated_at || localRecord.clearedAt;
                  }

                  const modeKey = mode_code === 1 ? 'time-attack' : 'survival';

                  // [Self-Healing Reconciliation]
                  // Merge local and server best scores (Take the winner)
                  if (
                    localRecord.bestScore[modeKey] === null ||
                    score > localRecord.bestScore[modeKey]!
                  ) {
                    localRecord.bestScore[modeKey] = score;
                    console.log(
                      `[Reconciliation] Restored higher server score for ${category} L${level}`
                    );
                  } else if (localRecord.bestScore[modeKey]! > score) {
                    // Local is higher (e.g., played offline) -> We should eventually sync this back to server
                    console.log(
                      `[Reconciliation] Local score higher for ${category} L${level}. Needs delayed sync.`
                    );
                  }
                });

                return { progress: newProgress };
              });
            }
          } catch (error) {
            console.error('Failed to sync progress from Supabase:', error);
            useToastStore.getState().showToast(UI_MESSAGES.FETCH_DATA_FAILED, 'error');
          }
        },

        resetProgress: async () => {
          const result = await LevelSyncService.resetProgress();

          if (!result.success) {
            console.error('Failed to reset progress:', result.error);
            useToastStore.getState().showToast(result.error || UI_MESSAGES.COMMON_ERROR, 'error');
            return;
          }

          // Local State 리셋 (성공 시에만)
          set({ progress: {} });
          console.log('[useLevelProgressStore] Progress reset completed via Service');
          useToastStore.getState().showToast('진행 상태가 초기화되었습니다.', 'success');
        },

        fetchRanking: async (world, category, period, type, limit = 50) => {
          try {
            let data: RankingRecord[] | null = null;
            let error: unknown = null;

            if (period === 'all-time') {
              // 명예의 전당 조회 (hall_of_fame 테이블)
              const { data: hofData, error: hofError } = await safeSupabaseQuery(
                supabase
                  .from('hall_of_fame')
                  .select('user_id, nickname, score, rank, week_start_date, tier_level, tier_stars')
                  .eq('mode', type)
                  .order('week_start_date', { ascending: false }) // 최신 시즌부터 표시
                  .order('rank', { ascending: true }) // 각 시즌별 1등부터 표시
                  .limit(limit)
              );
              data = hofData;
              error = hofError;
            } else {
              // 주간 랭킹 조회 (V2 RPC 사용)
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
                rankings: {
                  ...state.rankings,
                  [key]: data,
                },
              }));
            }
          } catch (error) {
            console.error('Failed to fetch ranking:', error);
            useToastStore.getState().showToast(UI_MESSAGES.RANKING_FETCH_FAILED, 'error');
          }
        },

        subscribeToRankingUpdates: () => {
          const state = get();
          if (state._rankingSubscription) return;

          console.log('[useLevelProgressStore] Subscribing to Realtime Ranking updates...');

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
              (payload) => {
                console.log('[useLevelProgressStore] Realtime event received:', payload);
                // Trigger re-render by incrementing version
                set((state) => ({ rankingVersion: (state.rankingVersion || 0) + 1 }));
              }
            )
            .subscribe();

          set({ _rankingSubscription: channel });
        },

        unsubscribeFromRankingUpdates: () => {
          const state = get();
          if (state._rankingSubscription) {
            console.log('[useLevelProgressStore] Unsubscribing from ranking updates...');
            state._rankingSubscription.unsubscribe();
            set({ _rankingSubscription: null });
          }
        },
      };
      /* eslint-enable security/detect-object-injection */
    },
    {
      name: 'solve-climb-level-progress',
      partialize: (state) => ({
        progress: state.progress,
        rankings: state.rankings,
        // Exclude _rankingSubscription and rankingVersion from persistence
      }),
    }
  )
);
