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
import { InventoryItem } from '@/features/auth';

// 1. State Context: 데이터 및 진행 상태
export interface QuizStateContextType {
  quizState: QuizDisplayState;
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
}

// 2. Handlers Context: 동작 관련 함수 (Stable)
export interface QuizHandlersContextType {
  quizHandlers: QuizHandlers;
  modalHandlers: QuizModalHandlers;
  handleTimeUp: () => void;
  setAnswerInput: (val: string) => void;
  setDisplayValue: (val: string) => void;
  setShowExitConfirm: (val: boolean) => void;
  setIsFadingOut: (val: boolean) => void;
  cancelExitConfirm: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  feedbackRef: React.RefObject<ItemFeedbackRef>;
}

// 3. Animation Context: 시각 효과 상태
export interface QuizAnimationContextType {
  quizAnimations: QuizAnimationState;
}

// 4. Modal Context: 모달 표시 상태
export interface QuizModalContextType {
  modalState: QuizModalState;
}

// 5. Input Context: 사용자 입력 상태 (가장 빈번하게 변경됨)
export interface QuizInputContextType {
  userInput: string;
  displayValue: string;
}

export const QuizStateContext = createContext<QuizStateContextType | null>(null);
export const QuizHandlersContext = createContext<QuizHandlersContextType | null>(null);
export const QuizAnimationContext = createContext<QuizAnimationContextType | null>(null);
export const QuizModalContext = createContext<QuizModalContextType | null>(null);
export const QuizInputContext = createContext<QuizInputContextType | null>(null);

export interface QuizTestProviderProps {
  children: React.ReactNode;
  value: any;
}

export function QuizTestProvider({ children, value }: QuizTestProviderProps) {
  const {
    quizState,
    inventory,
    minerals,
    isAnonymous,
    feverLevel,
    altitudePhase,
    promiseData,
    activeItems,
    usedItems,
    score,
    isExhausted,
    quizHandlers,
    modalHandlers,
    handleTimeUp,
    setAnswerInput,
    setDisplayValue,
    setShowExitConfirm,
    setIsFadingOut,
    cancelExitConfirm,
    inputRef,
    feedbackRef,
    quizAnimations,
    modalState,
    userInput,
    displayValue,
  } = value;

  const stateValue = {
    quizState,
    inventory: inventory || [],
    minerals: minerals || 0,
    isAnonymous: !!isAnonymous,
    feverLevel: feverLevel || 0,
    altitudePhase: altitudePhase || 'ground',
    promiseData: promiseData || { rule: '', example: '' },
    activeItems: activeItems || [],
    usedItems: usedItems || [],
    score: score || 0,
    isExhausted: !!isExhausted,
  };

  const handlersValue = {
    quizHandlers,
    modalHandlers,
    handleTimeUp,
    setAnswerInput,
    setDisplayValue,
    setShowExitConfirm,
    setIsFadingOut,
    cancelExitConfirm,
    inputRef,
    feedbackRef,
  };

  const inputValue = {
    userInput: userInput || quizState?.answerInput || '',
    displayValue: displayValue || quizState?.displayValue || '',
  };

  return (
    <QuizStateContext.Provider value={stateValue}>
      <QuizHandlersContext.Provider value={handlersValue}>
        <QuizAnimationContext.Provider value={{ quizAnimations }}>
          <QuizModalContext.Provider value={{ modalState }}>
            <QuizInputContext.Provider value={inputValue}>{children}</QuizInputContext.Provider>
          </QuizModalContext.Provider>
        </QuizAnimationContext.Provider>
      </QuizHandlersContext.Provider>
    </QuizStateContext.Provider>
  );
}

// Hooks for optimized access
export const useQuizState = () => {
  const context = useContext(QuizStateContext);
  if (!context) throw new Error('useQuizState must be used within a QuizProvider');
  return context;
};

export const useQuizInputState = () => {
  const context = useContext(QuizInputContext);
  if (!context) throw new Error('useQuizInputState must be used within a QuizProvider');
  return context;
};

export const useQuizHandlers = () => {
  const context = useContext(QuizHandlersContext);
  if (!context) throw new Error('useQuizHandlers must be used within a QuizProvider');
  return context;
};

export const useQuizAnimations = () => {
  const context = useContext(QuizAnimationContext);
  if (!context) throw new Error('useQuizAnimations must be used within a QuizProvider');
  return context;
};

export const useQuizModals = () => {
  const context = useContext(QuizModalContext);
  if (!context) throw new Error('useQuizModals must be used within a QuizProvider');
  return context;
};

/**
 * @deprecated 성능 최적화를 위해 useQuizState, useQuizHandlers 등을 사용하세요.
 */
export const useQuiz = () => {
  const state = useContext(QuizStateContext);
  const handlers = useContext(QuizHandlersContext);
  const animations = useContext(QuizAnimationContext);
  const modals = useContext(QuizModalContext);

  const input = useContext(QuizInputContext);

  if (!state || !handlers || !animations || !modals || !input) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }

  return {
    ...state,
    ...handlers,
    ...animations,
    ...modals,
    ...input,
  };
};
