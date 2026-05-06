import { createContext, useContext } from 'react';
import {
  QuizDisplayState,
  QuizAnimationState,
  QuizHandlers,
  QuizModalHandlers,
  QuizModalState,
  PromiseData,
} from '../types/quizProps';
import { ItemFeedbackRef } from '../types/feedback';
import { InventoryItem } from '@/types/user';

export interface QuizContextType {
  quizState: QuizDisplayState;
  quizAnimations: QuizAnimationState;
  quizHandlers: QuizHandlers;
  modalState: QuizModalState;
  modalHandlers: QuizModalHandlers;
  inputRef: React.RefObject<HTMLInputElement>;
  feedbackRef: React.RefObject<ItemFeedbackRef>;
  inventory: InventoryItem[];
  minerals: number;
  isAnonymous: boolean;
  feverLevel: number;
  altitudePhase: string;
  promiseData: PromiseData;
  activeItems: string[];
  usedItems: string[];
  score: number;
  isExhausted: boolean;
  handleTimeUp: () => void;
  setAnswerInput: (val: string) => void;
  setDisplayValue: (val: string) => void;
  setShowExitConfirm: (val: boolean) => void;
  setIsFadingOut: (val: boolean) => void;
  cancelExitConfirm: () => void;
}

export const QuizContext = createContext<QuizContextType | null>(null);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within a QuizProvider');
  return context;
};
