import { QuizQuestion, Category } from '@/types/quiz';

/**
 * 퀴즈 게임의 현재 상태 데이터 그룹
 */
export interface QuizDisplayState {
  currentQuestion: QuizQuestion | null;
  answerInput: string;
  displayValue: string;
  category: Category | null;
  topic: string;
  categoryParam: string | null;
  subParam: string | null;
  levelParam: number | null;
  gameMode: string;
  timeLimit: number;
  questionKey: number;
  timerResetKey: number;
  totalQuestions: number;
  lives: number;
  useSystemKeyboard: boolean;
  keyboardType: 'custom' | 'qwerty';
  showAnswer?: boolean;
  activeLandmark: { icon: string; text: string } | null;
  remainingPauses: number;
  altitudePhase: string;
  totalSteps?: number;
}

/**
 * 퀴즈 모달 핸들러 그룹
 */
export interface QuizModalHandlers {
  handleRevive: (useMineral: boolean) => Promise<void>;
  handlePurchaseAndRevive: () => Promise<void>;
  handleWatchAdAndRevive: () => Promise<void>;
  handleGiveUp: () => Promise<void>;
  handleCountdownComplete: () => void;
  setShowSafetyRope: (val: boolean) => void;
  handleBack: () => void;
  handleStartGame: (selectedItems: number[]) => Promise<void>;
  handlePauseResume: () => void;
  handlePauseExit: () => void;
  setShowStaminaModal: (val: boolean) => void;
  onAlertAction: (action: string) => void;
  handlePromiseComplete: () => void;
  setShowTutorial: (val: boolean) => void;
}

/**
 * 퀴즈 애니메이션 및 시각 효과 상태 그룹
 */
export interface QuizAnimationState {
  isSubmitting: boolean;
  isError: boolean;
  isPaused: boolean;
  isInputPaused: boolean;
  showExitConfirm: boolean;
  isFadingOut: boolean;
  cardAnimation: string;
  inputAnimation: string;
  questionAnimation: string;
  showFlash: boolean;
  showSlideToast: boolean;
  toastValue: string;
  damagePosition: { left: string; top: string };
}

/**
 * 퀴즈 게임 핸들러 그룹
 */
export interface QuizHandlers {
  onSafetyRopeUsed: () => void;
  onLastSpurt: () => void;
  onPause: () => void;
  generateNewQuestion: () => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleGameOver: (reason?: string) => void;
  handleKeypadNumber: (key: string) => void;
  handleQwertyKeyPress: (key: string) => void;
  handleKeypadClear: () => void;
  handleKeypadBackspace: () => void;
}
