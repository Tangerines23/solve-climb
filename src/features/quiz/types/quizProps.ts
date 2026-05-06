import React from 'react';
import { QuizQuestion, Category } from './quiz';

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
  worldParam: string | null;
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
  isPreview?: boolean;
}

/**
 * 퀴즈 모달 상태 데이터 그룹
 */
export interface QuizModalState {
  showLastChanceModal: boolean;
  showCountdown: boolean;
  showSafetyRope: boolean;
  showTipModal: boolean;
  showPauseModal: boolean;
  showStaminaModal: boolean;
  showTutorial: boolean;
  showPromise: boolean;
}

/**
 * 오늘의 약속 데이터 형식
 */
export interface PromiseData {
  rule: string;
  example: string;
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
  handleGameOver: (reason?: string) => void;
  handleKeypadNumber: (key: string) => void;
  handleQwertyKeyPress: (key: string) => void;
  handleKeypadClear: () => void;
  handleKeypadBackspace: () => void;
  handleSubmit: (e?: React.FormEvent) => void;
  onPause: () => void;
  onSafetyRopeUsed: () => void;
  onLastSpurt: () => void;
  generateNewQuestion: () => void;
}
