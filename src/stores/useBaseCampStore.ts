import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateQuestion } from '@/features/quiz';
import { QuizQuestion, Category } from '../types/quiz';

interface DiagnosticResult {
  accuracy: number;
  avgTime: number;
  recommendation: Category;
}

interface BaseCampState {
  isCompleted: boolean;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  results: Array<{ isCorrect: boolean; time: number }>;

  startDiagnostic: () => void;
  submitAnswer: (isCorrect: boolean, time: number) => void;
  getRecommendation: () => DiagnosticResult;
  resetBaseCamp: () => void;
  setCompleted: (completed: boolean) => void;
}

/**
 * [순수 함수] 베이스캠프 정답률 및 평균 시간에 따른 추천 카테고리 산출 (Zero-Else)
 */
export function calculateBaseCampRecommendation(accuracy: number, avgTime: number): Category {
  if (accuracy >= 90 && avgTime < 3000) {
    return '심화'; // Rock Climbing
  }
  if (accuracy >= 80) {
    return '대수'; // Steep
  }
  if (accuracy >= 60) {
    return '논리'; // Exploration
  }
  return '기초'; // General
}

/**
 * [BaseCamp Store]
 * 베이스캠프 진단 테스트 및 카테고리 추천 상태를 관리합니다.
 */
export const useBaseCampStore = create<BaseCampState>()(
  persist(
    (set, get) => ({
      isCompleted: false,
      questions: [],
      currentQuestionIndex: 0,
      results: [],

      startDiagnostic: () => {
        const questions: QuizQuestion[] = [];
        // Generate 10 diverse questions
        // 1-3: Basic (Math)
        for (let i = 1; i <= 3; i++) {
          questions.push(generateQuestion('math', 'World1', 'World1-기초', i * 3, 'easy'));
        }
        // 4-6: Logic
        for (let i = 1; i <= 3; i++) {
          questions.push(generateQuestion('math', 'World1', 'World1-논리', i * 2, 'easy'));
        }
        // 7-9: Algebra
        for (let i = 1; i <= 3; i++) {
          questions.push(generateQuestion('math', 'World1', 'World1-대수', i * 2, 'easy'));
        }
        // 10: Mixed/Random
        questions.push(generateQuestion('math', 'World1', 'World1-기초', 15, 'medium'));

        set({
          questions,
          currentQuestionIndex: 0,
          results: [],
        });
      },

      submitAnswer: (isCorrect, time) => {
        set((state) => ({
          results: [...state.results, { isCorrect, time }],
          currentQuestionIndex: state.currentQuestionIndex + 1,
        }));
      },

      getRecommendation: () => {
        const { results } = get();
        const correctCount = results.filter((r) => r.isCorrect).length;
        const totalTime = results.reduce((acc, r) => acc + r.time, 0);
        const accuracy = (correctCount / results.length) * 100;
        const avgTime = totalTime / results.length;
        const recommendation = calculateBaseCampRecommendation(accuracy, avgTime);

        return { accuracy, avgTime, recommendation };
      },

      resetBaseCamp: () =>
        set({
          questions: [],
          currentQuestionIndex: 0,
          results: [],
        }),

      setCompleted: (completed) => set({ isCompleted: completed }),
    }),
    {
      name: 'solve-climb-base-camp',
    }
  )
);
