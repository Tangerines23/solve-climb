// 레벨 진행 상태 관리 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabaseClient';
import { GameMode } from '../types/quiz';

export interface LevelRecord {
  level: number;
  cleared: boolean;
  bestScore: {
    'time-attack': number | null;
    survival: number | null;
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
    score: number
  ) => void;
  updateBestScore: (
    world: string,
    category: string,
    level: number,
    mode: GameMode,
    score: number
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
    world: string,
    category: string,
    period: 'weekly' | 'all-time',
    type: 'total' | 'time-attack' | 'survival',
    limit?: number
  ) => Promise<void>;
}

const getDefaultLevelRecord = (level: number): LevelRecord => ({
  level,
  cleared: false,
  bestScore: {
    'time-attack': null,
    survival: null,
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
        return state.progress[world]?.[category]?.[level]?.cleared ?? false;
      },

      getNextLevel: (world, category) => {
        const state = get();
        const worldProgress = state.progress[world];
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

      clearLevel: async (world, category, level, mode, score) => {
        // 1. Optimistic Update (Local)
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

          if (record.bestScore[mode] === null || score > record.bestScore[mode]!) {
            record.bestScore[mode] = score;
          }

          return { progress: newProgress };
        });

        // 2. Background Sync (Supabase)
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase.from('game_records').upsert(
            {
              user_id: user.id,
              category: world, // world를 category로 매핑
              subject: category, // category를 subject로 매핑
              level,
              mode,
              score,
              cleared: true,
              cleared_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id, category, subject, level, mode',
              ignoreDuplicates: false, // Update if exists
            }
          );

          if (error) throw error;
        } catch (error) {
          console.error('Failed to sync clearLevel to Supabase:', error);
        }
      },

      updateBestScore: async (world, category, level, mode, score) => {
        // 1. Optimistic Update (Local)
        set((state) => {
          const newProgress = { ...state.progress };

          if (!newProgress[world]) newProgress[world] = {};
          if (!newProgress[world][category]) newProgress[world][category] = {};
          if (!newProgress[world][category][level]) {
            newProgress[world][category][level] = getDefaultLevelRecord(level);
          }

          const record = newProgress[world][category][level];
          if (record.bestScore[mode] === null || score > record.bestScore[mode]!) {
            record.bestScore[mode] = score;
          }

          return { progress: newProgress };
        });

        // 2. Background Sync (Supabase)
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase.from('game_records').upsert(
            {
              user_id: user.id,
              category: world,
              subject: category,
              level,
              mode,
              score,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id, category, subject, level, mode',
            }
          );

          if (error) throw error;
        } catch (error) {
          console.error('Failed to sync updateBestScore to Supabase:', error);
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
        });

        return {
          'time-attack': bestTimeAttack,
          survival: bestSurvival,
        };
      },

      syncProgress: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { data: records, error } = await supabase
            .from('game_records')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (records) {
            set((state) => {
              const newProgress = { ...state.progress };

              records.forEach((serverRecord) => {
                const { category: world, subject: category, level, mode, score, cleared, cleared_at } = serverRecord;

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
                if (
                  localRecord.bestScore[modeKey] === null ||
                  score > localRecord.bestScore[modeKey]!
                ) {
                  localRecord.bestScore[modeKey] = score;
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
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase.from('game_records').delete().eq('user_id', user.id);

          if (error) throw error;
        } catch (error) {
          console.error('Failed to reset progress in Supabase:', error);
          // 에러가 발생해도 로컬은 이미 리셋되었으므로 계속 진행
        }
      },

      fetchRanking: async (world, category, period, type, limit = 50) => {
        try {
          const { data, error } = await supabase.rpc('get_ranking_v2', {
            p_category: world,
            p_period: period,
            p_type: type,
            p_limit: limit,
          });

          if (error) throw error;

          if (data) {
            set((state) => ({
              rankings: {
                ...state.rankings,
                [`${world}-${category}-${period}-${type}`]: data as RankingRecord[],
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
