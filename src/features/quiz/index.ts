/**
 * @domain 퀴즈 게임 플레이 엔진 (Quiz Engine)
 * @summary 일반 모드(60s)/서바이벌(10s) 퀴즈 출제, 타이머, 콤보, 점수 및 보상 판정
 */

// Context & Provider
export {
  QuizProvider,
  useQuiz,
  useQuizDisplayState,
  useQuizActionHandlers,
  useQuizModalState,
} from './contexts/QuizContext';

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
export {
  calculateTotalAltitude,
  calculateSubTopicProgress,
  calculateCategoryAltitude,
  getBaseLevelScore,
} from './utils/scoreCalculator';
