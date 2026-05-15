import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizQuestion, Category, World } from '../types/quiz';

export interface MissedQuestion extends QuizQuestion {
  id: string;
  world: World;
  category: Category;
  timestamp: number;
}

interface DeathNoteState {
  missedQuestions: MissedQuestion[];
  addMissedQuestion: (question: QuizQuestion, world: World, category: Category) => void;
  removeMissedQuestion: (id: string) => void;
  clearDeathNote: () => void;
  getQuestionsByCategory: (world: World, category: Category) => MissedQuestion[];
}

export const useDeathNoteStore = create<DeathNoteState>()(
  persist(
    (set, get) => ({
      missedQuestions: [],
      addMissedQuestion: (question, world, category) => {
        const id = crypto.randomUUID();
        const newMissed: MissedQuestion = {
          ...question,
          id,
          world,
          category,
          timestamp: Date.now(),
        };

        // 중복 체크 (선택 사항: 동일한 질문 텍스트면 갱신하거나 무시)
        const isDuplicate = get().missedQuestions.some(
          (q) => q.question === question.question && q.world === world && q.category === category
        );

        if (!isDuplicate) {
          set((state) => ({
            missedQuestions: [newMissed, ...state.missedQuestions].slice(0, 50), // 최대 50개 유지
          }));
        }
      },
      removeMissedQuestion: (id) => {
        set((state) => ({
          missedQuestions: state.missedQuestions.filter((q) => q.id !== id),
        }));
      },
      clearDeathNote: () => set({ missedQuestions: [] }),
      getQuestionsByCategory: (world, category) => {
        return get().missedQuestions.filter((q) => q.world === world && q.category === category);
      },
    }),
    {
      name: 'death-note-storage',
    }
  )
);
