// src/features/quiz/index.ts

// Pages
export { QuizPage } from './pages/QuizPage';
export { CategorySelectPage } from './pages/CategorySelectPage';
export { LevelSelectPage } from './pages/LevelSelectPage';
export { ResultPage } from './pages/ResultPage';

// Stores & Hooks
export { useQuizStore } from './stores/useQuizStore';
export type { QuizState } from './stores/useQuizStore';
export { useBaseCampStore } from './stores/useBaseCampStore';
export { useDeathNoteStore } from './stores/useDeathNoteStore';
export { useLevelProgressStore } from './stores/useLevelProgressStore';
export type { UserProgress } from './stores/useLevelProgressStore';
export { useGameStore } from './stores/useGameStore';
export { useGameFlowDebugBridge } from './hooks/bridge/useGameFlowDebugBridge';
export { useCyclePromotionModalBridge } from './hooks/bridge/useCyclePromotionModalBridge';
export { useTierDebugBridge } from './hooks/bridge/useTierDebugBridge';
export { useGameActions } from './hooks/bridge/useGameActions';
export { useStamina } from './hooks/core/useStamina';
export { useStatusCard } from './hooks/bridge/useStatusCard';
export { calculateScoreForTier } from './utils/tierUtils';

// Utils
export { generateQuestion } from './utils/quizGenerator';
export { getTodayChallenge } from './utils/challenge';
export {
  loadTierDefinitions,
  loadCycleCap,
  calculateTier,
  calculateTierSync,
  getNextTierInfo,
  getTierInfo,
} from './constants/tiers';
export type { TierLevel, TierInfo, TierCalculationResult } from './constants/tiers';

// Providers & Contexts
export { QuizProvider } from './contexts/QuizProvider';
export { useQuiz } from './contexts/QuizContext';

// Components (Publicly reusable components)
export { QuizCard } from './components/QuizCard';
export { QuizPreview } from './components/QuizPreview';
export { CustomKeypad } from './components/input/CustomKeypad';
export { TimerCircle } from './components/TimerCircle';
export { PauseModal } from './components/game/PauseModal';
export { LastChanceModal } from './components/game/LastChanceModal';
export { GameTipModal } from './components/game/GameTipModal';
export { GameAlertModal } from './components/game/GameAlertModal';
export { KeyboardInfoModal } from './components/modals/KeyboardInfoModal';
export { ItemFeedbackOverlay } from './components/game/ItemFeedbackOverlay';
export { CountdownOverlay } from './components/overlays/CountdownOverlay';
export { SafetyRopeOverlay } from './components/game/SafetyRopeOverlay';
export { GameOverlay } from './components/game/GameOverlay';
export { BackpackBottomSheet } from './components/game/BackpackBottomSheet';
export { TierBadge } from './components/TierBadge';
export { TierProgressBar } from './components/TierProgressBar';
export { TierUpgradeModal } from './components/TierUpgradeModal';
export { CyclePromotionModal } from './components/CyclePromotionModal';
export { CategoryList } from './components/CategoryList';
export { LevelListCard } from './components/LevelListCard';
export { ClimbGraphic } from './components/ClimbGraphic';
export { TopicHeader } from './components/TopicHeader';
export { ChallengeCard } from './components/ChallengeCard';
export { LandmarkPopup } from './components/LandmarkPopup';
export { TodaysPromise } from './components/TodaysPromise';
export { UnknownMountainCard } from './components/UnknownMountainCard';
export { StaminaGauge } from './components/StaminaGauge';
export { MyRecordCard } from './components/MyRecordCard';
export { StatusCard } from './components/StatusCard';
export { ModeSelectModal } from './components/modals/ModeSelectModal';

// Types (Core domain types)
export * from './types/quiz';
export * from './types/challenge';

// Constants
export { 
  ANIMATION_CONFIG, 
  GAME_CONFIG, 
  CATEGORY_CONFIG, 
  LANDMARK_MAPPING, 
  SURVIVAL_CONFIG, 
  MAX_POSSIBLE_ANSWER,
  THEME_MULTIPLIERS,
  BOSS_LEVEL,
  BOSS_BONUS,
  UI_MESSAGES,
  CATEGORY_IDS,
  MATH_SUB_IDS,
  SUB_CATEGORY_IDS,
  type ThemeTier
} from './constants/game';
