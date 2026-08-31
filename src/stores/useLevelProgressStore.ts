// 레벨 진행 상태 관리 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { GameMode, Tier } from '../types/quiz';
import { useDebugStore } from './useDebugStore';
import { useToastStore } from './useToastStore';
import { UI_MESSAGES } from '../constants/ui';
import { safeAccess } from '../utils/validation';
import { LevelSyncService } from '@/features/quiz';
import { ProgressRepository } from '../services/ProgressRepository';

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

interface LevelProgressState {
  progress: UserProgress;

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
}

const isNetworkError = (errorMsg?: string): boolean => {
  if (typeof window !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  if (!errorMsg) return false;
  const msg = errorMsg.toLowerCase();
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('연결 실패') ||
    msg.includes('abort') ||
    msg.includes('connection')
  );
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

let isSyncingProgress = false;

/**
 * [Level Progress Store]
 * 스테이지/레벨 클리어 현황, 최고 점수 및 오프라인-온라인 동기화를 관리합니다.
 */
export const useLevelProgressStore = create<LevelProgressState>()(
  persist(
    (set, get) => {
      /* eslint-disable security/detect-object-injection -- progress/rankings keys (world, category, level, mode) are validated store params */
      return {
        progress: {},

        getLevelProgress: (world, category, tier = 'normal') => {
          const state = get();
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          const worldProgress = state.progress[worldKey];
          if (!worldProgress || !worldProgress[category]) {
            return [];
          }
          return Object.values(worldProgress[category]).sort((a, b) => a.level - b.level);
        },

        isLevelCleared: (world, category, level, tier = 'normal') => {
          const state = get();
          if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) return true;
          const worldKey = tier === 'hard' ? `${world}_hard` : world;

          const worldProgress = safeAccess(state.progress, worldKey) as
            Record<string, unknown> | undefined;
          const categoryProgress = safeAccess(worldProgress, category) as
            Record<number, LevelRecord> | undefined;
          const levelRecord = safeAccess(categoryProgress, level) as LevelRecord | undefined;

          return levelRecord?.cleared ?? false;
        },

        getNextLevel: (world, category, tier = 'normal') => {
          const state = get();
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          const worldProgress = safeAccess(state.progress, worldKey) as
            Record<string, unknown> | undefined;

          if (import.meta.env.DEV && useDebugStore.getState().bypassLevelLock) {
            return 999; // bypass 시에는 어떤 레벨이든 통과 가능하도록 큰 값 반환
          }

          const categoryProgress = safeAccess(worldProgress, category) as
            Record<number, LevelRecord> | undefined;
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
            world,
            avgSolveTime,
            sessionData,
            tier,
          });

          if (!result.success) {
            console.error('[clearLevel] Sync failed:', result.error);
            if (isNetworkError(result.error)) {
              // 네트워크 에러/오프라인인 경우 기록 롤백 생략 (기기에 로컬 세이브 보존)
              useToastStore
                .getState()
                .showToast('오프라인 상태입니다. 기록은 기기에 임시 저장됩니다.', 'warning');
            } else {
              // 사용자 정보 없음 또는 보안/DB 위반은 기존과 동일하게 롤백
              set({ progress: previousProgress });
              if (result.error !== 'No user found') {
                useToastStore.getState().showToast(result.error || '저장 실패', 'error');
              }
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
            world,
            avgSolveTime,
            sessionData,
            tier,
          });

          if (!result.success) {
            console.error('[updateBestScore] Sync failed:', result.error);
            if (isNetworkError(result.error)) {
              // 오프라인 상태이면 베스트 스코어 로컬 보존
              useToastStore
                .getState()
                .showToast('오프라인 상태입니다. 기록은 기기에 임시 저장됩니다.', 'warning');
            } else {
              set({ progress: previousProgress });
            }
          }
        },

        getBestRecords: (world, category, tier = 'normal') => {
          const state = get();
          const worldKey = tier === 'hard' ? `${world}_hard` : world;
          const worldProgress = state.progress[worldKey];
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
          if (isSyncingProgress) return;
          isSyncingProgress = true;

          try {
            const authResult = await safeSupabaseQuery(supabase.auth.getUser());
            const user = authResult?.data?.user;
            if (!user) return;

            const { data: records, error } = await ProgressRepository.fetchServerProgress(user.id);

            if (error) throw error;

            if (records) {
              set((state) => {
                const newProgress = { ...state.progress };
                const serverKeySet = new Set<string>();

                records.forEach((serverRecord) => {
                  const world = serverRecord.world_id || 'world1';
                  const category_id = serverRecord.category_id || '';
                  const subject_id = serverRecord.subject_id || '';
                  const level = serverRecord.level;
                  const mode_code = serverRecord.mode_code ?? 1;
                  const score = serverRecord.best_score ?? 0;
                  const updated_at = serverRecord.updated_at;

                  const category = `${category_id}_${subject_id}`;
                  serverKeySet.add(`${world}#${category}#${level}#${mode_code}`);

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
                    // Local is higher (e.g., played offline) -> Background delayed sync to server
                    console.log(
                      `[Reconciliation] Local score higher for ${category} L${level}. Syncing back to server.`
                    );
                    LevelSyncService.submitGameResult({
                      category,
                      level,
                      mode: modeKey,
                      score: localRecord.bestScore[modeKey]!,
                      world,
                    }).catch((err) => {
                      console.warn(
                        `[Reconciliation] Delayed sync failed for ${category} L${level}:`,
                        err
                      );
                    });
                  }
                });

                // [Reverse Reconciliation for Offline-Created Records]
                // Scan local records that do not exist on the server yet
                Object.entries(newProgress).forEach(([worldKey, worldData]) => {
                  if (!worldData || typeof worldData !== 'object') return;
                  Object.entries(worldData).forEach(([categoryKey, catData]) => {
                    if (!catData || typeof catData !== 'object') return;
                    Object.entries(catData).forEach(([levelKey, localRecord]) => {
                      if (!localRecord || !localRecord.cleared) return;
                      const levelNum = Number(levelKey);

                      if (localRecord.bestScore['time-attack'] !== null) {
                        const key = `${worldKey}#${categoryKey}#${levelNum}#1`;
                        if (!serverKeySet.has(key)) {
                          console.log(
                            `[Reconciliation] Syncing local-only offline clear for ${categoryKey} L${levelNum} (time-attack)`
                          );
                          LevelSyncService.submitGameResult({
                            category: categoryKey,
                            level: levelNum,
                            mode: 'time-attack',
                            score: localRecord.bestScore['time-attack']!,
                            world: worldKey,
                          }).catch((err) => {
                            console.warn(`[Reconciliation] Delayed sync failed:`, err);
                          });
                        }
                      }

                      if (localRecord.bestScore.survival !== null) {
                        const key = `${worldKey}#${categoryKey}#${levelNum}#2`;
                        if (!serverKeySet.has(key)) {
                          console.log(
                            `[Reconciliation] Syncing local-only offline clear for ${categoryKey} L${levelNum} (survival)`
                          );
                          LevelSyncService.submitGameResult({
                            category: categoryKey,
                            level: levelNum,
                            mode: 'survival',
                            score: localRecord.bestScore.survival!,
                            world: worldKey,
                          }).catch((err) => {
                            console.warn(`[Reconciliation] Delayed sync failed:`, err);
                          });
                        }
                      }
                    });
                  });
                });

                return { progress: newProgress };
              });
            }
          } catch (error) {
            console.error('Failed to sync progress from Supabase:', error);
            useToastStore.getState().showToast(UI_MESSAGES.FETCH_DATA_FAILED, 'error');
          } finally {
            isSyncingProgress = false;
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
      };
      /* eslint-enable security/detect-object-injection */
    },
    {
      name: 'solve-climb-level-progress',
      partialize: (state) => ({
        progress: state.progress,
      }),
    }
  )
);
