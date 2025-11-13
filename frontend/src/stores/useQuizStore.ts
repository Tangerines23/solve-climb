// src/stores/useQuizStore.ts
import { create } from 'zustand';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface QuizState {
  score: number;
  difficulty: Difficulty;
  increaseScore: (amount: number) => void;
  setDifficulty: (level: Difficulty) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  score: 0,
  difficulty: 'easy',
  increaseScore: (amount) => set((state) => ({ score: state.score + amount })),
  setDifficulty: (level) => set({ difficulty: level }),
  resetQuiz: () => set({ score: 0, difficulty: 'easy' }),
}));