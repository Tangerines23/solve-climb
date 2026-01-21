import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateQuestion } from '../utils/quizGenerator';
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
                    questions.push(generateQuestion('World1', '기초', i * 3, 'easy'));
                }
                // 4-6: Logic
                for (let i = 1; i <= 3; i++) {
                    questions.push(generateQuestion('World1', '논리', i * 2, 'easy'));
                }
                // 7-9: Algebra
                for (let i = 1; i <= 3; i++) {
                    questions.push(generateQuestion('World1', '대수', i * 2, 'easy'));
                }
                // 10: Mixed/Random
                questions.push(generateQuestion('World1', '기초', 15, 'medium'));

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
                const correctCount = results.filter(r => r.isCorrect).length;
                const totalTime = results.reduce((acc, r) => acc + r.time, 0);
                const accuracy = (correctCount / results.length) * 100;
                const avgTime = totalTime / results.length;

                let recommendation: Category = '기초';
                if (accuracy >= 90 && avgTime < 3000) {
                    recommendation = '심화'; // Rock Climbing
                } else if (accuracy >= 80) {
                    recommendation = '대수'; // Steep
                } else if (accuracy >= 60) {
                    recommendation = '논리'; // Exploration
                } else {
                    recommendation = '기초'; // General
                }

                return { accuracy, avgTime, recommendation };
            },

            resetBaseCamp: () => set({
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
