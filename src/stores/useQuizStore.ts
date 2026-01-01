// src/stores/useQuizStore.ts
import { create } from 'zustand';
import { Category, Topic, GameMode, Difficulty } from '../types/quiz';

// 시간 설정 (초 단위)
export type TimeLimit = 10 | 15 | 60 | 120 | 180; // 10s/15s(Revive), 1min, 2min, 3min

interface QuizState {
  score: number;
  difficulty: Difficulty;
  // (신규) 지시서 2-1항 반영
  gameMode: GameMode;
  // 카테고리와 분야
  category: Category | null;
  topic: Topic | null;
  // 시간 제한
  timeLimit: TimeLimit;
  increaseScore: (amount: number) => void;
  decreaseScore: (amount: number) => void;
  setDifficulty: (level: Difficulty) => void;
  resetQuiz: () => void;
  // (신규) 지시서 2-1항 반영
  setGameMode: (mode: GameMode) => void;
  // 카테고리와 분야 설정
  setCategoryTopic: (category: Category, topic: Topic) => void;
  // 시간 제한 설정
  setTimeLimit: (time: TimeLimit) => void;
}

// <-- 2. 'useQuizStore'가 export 되었는지 확인
export const useQuizStore = create<QuizState>((set) => ({
  score: 0,
  difficulty: 'easy',
  // (신규) 지시서 2-1항 반영
  gameMode: 'time-attack',
  category: null,
  topic: null,
  timeLimit: 60, // 기본 1분
  increaseScore: (amount) => set((state) => ({ score: state.score + amount })),
  decreaseScore: (amount) => set((state) => ({ score: Math.max(0, state.score - amount) })),
  setDifficulty: (level) => set({ difficulty: level }),
  resetQuiz: () => set({ score: 0, difficulty: 'easy', timeLimit: 60 }),
  // (신규) 지시서 2-1항 반영
  setGameMode: (mode) => set({ gameMode: mode }),
  setCategoryTopic: (category, topic) => set({ category, topic }),
  setTimeLimit: (time) => set({ timeLimit: time }),
}));
