// Quiz Feature Public API Barrel File

export { QuizProvider, useQuiz } from './contexts/QuizContext';
export { QuizLayout } from './components/QuizLayout';
export { QuizCard } from './components/QuizCard';
export { LevelSyncService } from './services/LevelSyncService';

// Hooks
export { useQuizBusinessLogic } from './hooks/useQuizBusinessLogic';
export { useQuizGameState } from './hooks/useQuizGameState';
export { useQuizInput } from './hooks/useQuizInput';
export { useQuizNavigation } from './hooks/useQuizNavigation';
export { useQuizSubmit } from './hooks/useQuizSubmit';

// Types
export * from './types/quiz';
export * from './types/quizProps';
export { Altitude, type Result } from './domain/Altitude';
