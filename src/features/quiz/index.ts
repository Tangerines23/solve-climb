// Quiz Feature Public API Barrel File

// Context & Provider
export { QuizProvider, useQuiz } from './contexts/QuizContext';

// Core UI & Layout
export { QuizLayout } from './components/QuizLayout';
export { QuizCard } from './components/QuizCard';

// Services & Synchronization
export { LevelSyncService } from './services/LevelSyncService';
export { setupQuizEventListeners } from './services/quizEventListener';

// Domain Models & Types
export * from './types/quiz';
export * from './types/quizProps';
export { Altitude, type Result } from './domain/Altitude';
export { Combo } from './domain/Combo';

// Generators Engine (Public Facade)
export { generateQuestion } from './generators/quizGenerator';
export { getSolutionProcess } from './generators/solutionExplainer';

// Pure Calculation Utils
export { calculateTotalAltitude, calculateSubTopicProgress } from './utils/scoreCalculator';

