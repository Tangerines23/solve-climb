// src/stores/useQuizStore.ts
import { create } from 'zustand';
import { Category, World, GameMode, Difficulty } from '../types/quiz';

// 시간 설정 (초 단위)
export type TimeLimit = 10 | 15 | 60 | 120 | 180; // 10s/15s(Revive), 1min, 2min, 3min

export interface QuizState {
  score: number;
  difficulty: Difficulty;
  gameMode: GameMode;
  // 카테고리와 월드
  category: Category | null;
  world: World | null;
  level: number;
  // 시간 제한
  timeLimit: TimeLimit;
  increaseScore: (amount: number) => void;
  decreaseScore: (amount: number) => void;
  setDifficulty: (level: Difficulty) => void;
  resetQuiz: () => void;
  setGameMode: (mode: GameMode) => void;
  // 카테고리, 월드, 레벨 설정
  setQuizContext: (category: Category, world: World, level: number) => void;
  // 호환성을 위한 메서드
  setCategoryTopic: (category: Category, world: World) => void;
  // 시간 제한 설정
  setTimeLimit: (time: TimeLimit) => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  score: 0,
  difficulty: 'easy',
  gameMode: 'time-attack',
  category: null,
  world: null,
  level: 1,
  timeLimit: 60, // 기본 1분
  increaseScore: (amount) => set((state) => ({ score: state.score + amount })),
  decreaseScore: (amount) => set((state) => ({ score: Math.max(0, state.score - amount) })),
  setDifficulty: (level) => set({ difficulty: level }),
  resetQuiz: () => set({ score: 0, difficulty: 'easy', timeLimit: 60, level: 1 }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setQuizContext: (category, world, level) => set({ category, world, level }),
  setCategoryTopic: (category, world) => set({ category, world }),
  setTimeLimit: (time) => set({ timeLimit: time }),
}));
