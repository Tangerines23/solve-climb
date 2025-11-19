// 레벨 진행 상태 관리 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameMode = 'time-attack' | 'survival';

export interface LevelRecord {
  level: number;
  cleared: boolean;
  bestScore: {
    'time-attack': number | null;
    'survival': number | null;
  };
  clearedAt?: string;
}

export interface CategorySubProgress {
  [subTopic: string]: {
    [level: number]: LevelRecord;
  };
}

export interface UserProgress {
  [category: string]: CategorySubProgress;
}

interface LevelProgressState {
  progress: UserProgress;
  // 특정 카테고리-서브토픽의 레벨 진행 상태 가져오기
  getLevelProgress: (category: string, subTopic: string) => LevelRecord[];
  // 레벨 클리어 상태 확인
  isLevelCleared: (category: string, subTopic: string, level: number) => boolean;
  // 다음 도전 레벨 가져오기
  getNextLevel: (category: string, subTopic: string) => number;
  // 레벨 클리어 처리
  clearLevel: (category: string, subTopic: string, level: number, mode: GameMode, score: number) => void;
  // 최고 기록 업데이트
  updateBestScore: (category: string, subTopic: string, level: number, mode: GameMode, score: number) => void;
  // 특정 카테고리-서브토픽의 최고 기록 가져오기
  getBestRecords: (category: string, subTopic: string) => {
    'time-attack': number | null;
    'survival': number | null;
  };
}

const getDefaultLevelRecord = (level: number): LevelRecord => ({
  level,
  cleared: false,
  bestScore: {
    'time-attack': null,
    'survival': null,
  },
});

export const useLevelProgressStore = create<LevelProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      getLevelProgress: (category, subTopic) => {
        const state = get();
        const categoryProgress = state.progress[category];
        if (!categoryProgress || !categoryProgress[subTopic]) {
          return [];
        }
        return Object.values(categoryProgress[subTopic]).sort((a, b) => a.level - b.level);
      },

      isLevelCleared: (category, subTopic, level) => {
        const state = get();
        return (
          state.progress[category]?.[subTopic]?.[level]?.cleared ?? false
        );
      },

      getNextLevel: (category, subTopic) => {
        const state = get();
        const categoryProgress = state.progress[category];
        if (!categoryProgress || !categoryProgress[subTopic]) {
          return 1; // 첫 레벨부터 시작
        }

        const levels = Object.values(categoryProgress[subTopic])
          .filter((record) => record.cleared)
          .map((record) => record.level)
          .sort((a, b) => b - a);

        if (levels.length === 0) {
          return 1;
        }

        return levels[0] + 1; // 마지막 클리어 레벨 + 1
      },

      clearLevel: (category, subTopic, level, mode, score) => {
        set((state) => {
          const newProgress = { ...state.progress };
          
          if (!newProgress[category]) {
            newProgress[category] = {};
          }
          if (!newProgress[category][subTopic]) {
            newProgress[category][subTopic] = {};
          }
          if (!newProgress[category][subTopic][level]) {
            newProgress[category][subTopic][level] = getDefaultLevelRecord(level);
          }

          const record = newProgress[category][subTopic][level];
          record.cleared = true;
          record.clearedAt = new Date().toISOString();

          // 최고 기록 업데이트
          if (record.bestScore[mode] === null || score > record.bestScore[mode]!) {
            record.bestScore[mode] = score;
          }

          return { progress: newProgress };
        });
      },

      updateBestScore: (category, subTopic, level, mode, score) => {
        set((state) => {
          const newProgress = { ...state.progress };
          
          if (!newProgress[category]) {
            newProgress[category] = {};
          }
          if (!newProgress[category][subTopic]) {
            newProgress[category][subTopic] = {};
          }
          if (!newProgress[category][subTopic][level]) {
            newProgress[category][subTopic][level] = getDefaultLevelRecord(level);
          }

          const record = newProgress[category][subTopic][level];
          if (record.bestScore[mode] === null || score > record.bestScore[mode]!) {
            record.bestScore[mode] = score;
          }

          return { progress: newProgress };
        });
      },

      getBestRecords: (category, subTopic) => {
        const state = get();
        const categoryProgress = state.progress[category];
        if (!categoryProgress || !categoryProgress[subTopic]) {
          return { 'time-attack': null, 'survival': null };
        }

        const records = Object.values(categoryProgress[subTopic]);
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
          'survival': bestSurvival,
        };
      },
    }),
    {
      name: 'solve-climb-level-progress',
    }
  )
);

