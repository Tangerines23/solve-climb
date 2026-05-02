import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '@/stores/useQuizStore';
import { useQuestionGenerator } from '@/hooks/useQuestionGenerator';
import { useQuizInput } from '@/hooks/useQuizInput';
import { useQuizGameState } from '@/hooks/quiz/useQuizGameState';
import { useQuizAnimations } from '@/hooks/useQuizAnimations';
import { useQuizSubmit } from '@/hooks/quiz/useQuizSubmit';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ANIMATION_CONFIG } from '@/constants/game';
import { useQuizRevive } from '@/hooks/quiz/useQuizRevive';
import { useUserStore } from '@/stores/useUserStore';
import { useGameStore } from '@/stores/useGameStore';
import { useToastStore } from '@/stores/useToastStore';
import type { Category, World, QuizQuestion } from '@/types/quiz';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import { useBaseCampStore } from '@/stores/useBaseCampStore';
import { useQuizBusinessLogic } from '@/hooks/useQuizBusinessLogic';
import { useQuizNavigation } from '@/hooks/useQuizNavigation';
import { useQuizStartLogic } from '@/hooks/useQuizStartLogic';
import { useQuizSession } from '@/hooks/useQuizSession';
import { useQuizGameplay } from '@/hooks/useQuizGameplay';
import { quizEventBus } from '@/lib/eventBus';
import { useQuizModals } from '@/hooks/quiz/useQuizModals';
import { useQuizEventProcessor } from '@/hooks/quiz/useQuizEventProcessor';
import { useQuizScoreManager } from '@/hooks/quiz/useQuizScoreManager';
import {
  QuizDisplayState,
  QuizAnimationState,
  QuizHandlers,
  QuizModalHandlers,
} from '@/types/quizProps';

interface QuizContextType {
  quizState: QuizDisplayState;
  quizAnimations: QuizAnimationState;
  quizHandlers: QuizHandlers;
  modalState: any;
  modalHandlers: QuizModalHandlers;
  inputRef: React.RefObject<HTMLInputElement>;
  feedbackRef: React.RefObject<ItemFeedbackRef>;
  // Additional states needed by Layout
  inventory: any[];
  minerals: number;
  isAnonymous: boolean;
  feverLevel: number;
  altitudePhase: string;
  promiseData: any;
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

interface QuizProviderProps {
  children: React.ReactNode;
  params: {
    worldParam: string | null;
    categoryParam: string | null;
    levelParam: number | null;
    modeParam: string | null;
    isPreview: boolean;
    mountainParam: string | null;
    searchParams: URLSearchParams;
  };
}

export function QuizProvider({ children, params }: QuizProviderProps) {
  const {
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    isPreview,
    mountainParam,
    searchParams,
  } = params;

  const { score, feverLevel, lives, isExhausted, consumeLife } = useQuizScoreManager();

  const difficulty = useQuizStore((state) => state.difficulty);
  const resetQuiz = useQuizStore((state) => state.resetQuiz);
  const category = useQuizStore((state) => state.category);
  const world = useQuizStore((state) => state.world);
  const timeLimit = useQuizStore((state) => state.timeLimit);
  const setGameMode = useQuizStore((state) => state.setGameMode);
  const gameMode = useQuizStore((state) => state.gameMode);
  const setQuizContext = useQuizStore((state) => state.setQuizContext);
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [toastValue, setToastValue] = useState('');
  const [useSystemKeyboard] = useState(false);
  const [infiniteTimeLimit, setInfiniteTimeLimit] = useState(10);
  const [, setTotalInfiniteSolved] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  const {
    stamina,
    inventory,
    isAnonymous,
    checkStamina,
    consumeItem,
    consumeStamina,
    recoverStaminaAds,
    refundStamina,
    minerals,
  } = useUserStore();

  const { showToast: showGlobalToast } = useToastStore();
  const animations = useQuizAnimations();

  const { modals, modalHandlers: rawModalHandlers } = useQuizModals();
  const {
    showLastChanceModal,
    showCountdown,
    showSafetyRope,
    showPauseModal,
    showTutorial,
    showPromise,
    showStaminaModal,
    showTipModal,
    isFlarePaused,
  } = modals;

  const {
    setShowLastChanceModal,
    setShowCountdown,
    setShowSafetyRope,
    setShowPauseModal,
    setShowTutorial,
    setShowPromise,
    setShowStaminaModal,
    setShowTipModal,
    setIsFlarePaused,
  } = rawModalHandlers;

  const { setExhausted, resetGame, isStaminaConsumed, activeItems, usedItems, consumeActiveItem } =
    useGameStore();

  const [questionKey, setQuestionKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<ItemFeedbackRef>(null);

  const gameState = useQuizGameState({
    score,
    gameMode,
    mountainParam,
    worldParam,
    categoryParam,
    subParam: worldParam,
    levelParam,
    modeParam,
    isExhausted,
    navigate,
  });

  const useQuizSessionResult = useQuizSession({
    showTipModal,
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    mountainParam,
    setGameSessionId: gameState.setGameSessionId,
  });

  const { sessionCreated } = useQuizSessionResult;

  const { generateNewQuestion } = useQuestionGenerator({
    category,
    world,
    difficulty,
    gameMode,
    worldParam,
    categoryParam,
    levelParam,
    totalQuestions: gameState.totalQuestions,
    preGeneratedQuestions: useQuizSessionResult.preGeneratedQuestions,
  });

  const generateNewQuestionRef = useRef(generateNewQuestion);
  useEffect(() => {
    generateNewQuestionRef.current = generateNewQuestion;
  }, [generateNewQuestion]);

  const { handleWatchAdRevive, handleStaminaAdRecovery } = useQuizBusinessLogic({
    setToastValue,
    setShowSlideToast: animations.setShowSlideToast,
    showGlobalToast,
    refundStamina,
    recoverStaminaAds,
    handleGameOver: gameState.handleGameOver,
    totalQuestions: gameState.totalQuestions,
  });

  const {
    handleStartGame,
    promiseData,
    activeLandmark,
    altitudePhase,
    handlePromiseComplete,
    onAlertAction,
  } = useQuizStartLogic({
    stamina,
    inventory,
    consumeItem,
    consumeStamina,
    worldParam,
    categoryParam,
    gameMode,
    totalQuestions: gameState.totalQuestions,
    handleStaminaAdRecovery: () => handleStaminaAdRecovery(setShowStaminaModal),
  });

  const { handleRevive, handlePurchaseAndRevive, handleGiveUp, stableHandleGameOver } =
    useQuizRevive({
      gameMode: gameMode as 'time-attack' | 'survival',
      inventory,
      minerals,
      consumeItem,
      onWatchAd: handleWatchAdRevive,
      isPreview,
    });

  const {
    showExitConfirm,
    setShowExitConfirm,
    isFadingOut,
    setIsFadingOut,
    handleBack,
    cancelExitConfirm,
  } = useQuizNavigation({
    totalQuestions: gameState.totalQuestions,
    showTipModal,
    refundStamina,
    navigate,
    mountainParam,
    worldParam,
    categoryParam,
    searchParams,
  });

  const {
    remainingPauses,
    timerResetKey,
    handleTutorialClick,
    handlePauseResume,
    handlePauseExit,
    handleCountdownComplete,
  } = useQuizGameplay({
    setToastValue,
  });

  const handleTimeUp = useCallback(() => {
    const hasSafetyRope = activeItems.includes('safety_rope');
    const hasLastSpurt = gameMode === 'time-attack' && activeItems.includes('last_spurt');

    if (hasSafetyRope) {
      consumeActiveItem('safety_rope');
      quizEventBus.emit('QUIZ:SAFETY_ROPE_USED');
    } else if (hasLastSpurt) {
      consumeActiveItem('last_spurt');
      quizEventBus.emit('QUIZ:LAST_SPURT');
    } else if (gameMode === 'survival') {
      const hasFlare = activeItems.includes('flare');
      if (hasFlare) {
        consumeActiveItem('flare');
        quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
      } else if (lives > 1) {
        consumeLife();
        quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
      } else {
        consumeLife();
        quizEventBus.emit('QUIZ:GAME_OVER', { reason: 'timeout' });
      }
    } else {
      quizEventBus.emit('QUIZ:GAME_OVER', { reason: 'timeout' });
    }
  }, [activeItems, gameMode, lives, consumeActiveItem, consumeLife]);

  const { handleSubmit } = useQuizSubmit({
    answerInput,
    isSubmitting,
    currentQuestion,
    categoryParam: categoryParam || '',
    subParam: worldParam || '',
    gameMode,
    questionStartTime: gameState.questionStartTime,
    currentQuestionId,
  });

  const handleWatchAdAndRevive = useCallback(async () => {
    const success = await handleWatchAdRevive();
    if (success) {
      await handleRevive(false);
    }
  }, [handleWatchAdRevive, handleRevive]);

  const { handleKeypadNumber, handleQwertyKeyPress, handleKeypadClear, handleKeypadBackspace } =
    useQuizInput({
      isSubmitting,
      isError: animations.isError,
      isPaused:
        showTipModal || showLastChanceModal || showCountdown || isFlarePaused || showPauseModal,
      categoryParam: categoryParam || '',
      subParam: '',
      setAnswerInput,
      setDisplayValue,
      onInputStart: () => setIsFlarePaused(false),
    });

  useEffect(() => {
    if (worldParam && categoryParam && levelParam !== null)
      setQuizContext(categoryParam as Category, worldParam as World, levelParam);
  }, [worldParam, categoryParam, levelParam, setQuizContext]);

  useEffect(() => {
    resetQuiz();
    resetGame();
    checkStamina().then(() => {
      if (stamina <= 0) setExhausted(true);
    });
    if (modeParam === 'base-camp') {
      useBaseCampStore.getState().startDiagnostic();
      setShowTipModal(false);
      setShowTutorial(true);
    }
  }, [
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    resetQuiz,
    resetGame,
    checkStamina,
    setExhausted,
    stamina,
    setShowTipModal,
    setShowTutorial,
  ]);

  useEffect(() => {
    if (!showTipModal && !sessionCreated)
      setTimeout(() => generateNewQuestionRef.current(), ANIMATION_CONFIG.QUERY_PARAM_DELAY);
  }, [showTipModal, sessionCreated]);

  useEffect(() => {
    if (modeParam && (modeParam === 'time-attack' || modeParam === 'survival')) {
      setGameMode(modeParam as 'time-attack' | 'survival');
    }
  }, [modeParam, setGameMode]);

  // 3. Centralized Event Processor
  useQuizEventProcessor({
    gameState,
    animations,
    feedbackRef,
    inputRef,
    currentQuestion,
    currentQuestionId,
    gameMode,
    modeParam,
    worldParam,
    categoryParam,
    lives,
    hapticEnabled,
    useSystemKeyboard,
    generateNewQuestion,
    smartHandleGameOver: stableHandleGameOver,
    handleTimeUp,
    consumeLife,
    setAnswerInput,
    setDisplayValue,
    setIsSubmitting,
    setCurrentQuestion,
    setCurrentQuestionId,
    setQuestionKey,
    setInfiniteTimeLimit,
    setTotalInfiniteSolved,
    setShowLastChanceModal,
    setShowCountdown,
    setShowSafetyRope,
    setShowTipModal,
    setShowPauseModal,
    setShowStaminaModal,
    setShowTutorial,
    setShowPromise,
  });

  useEffect(() => {
    if (isPreview || isStaminaConsumed) return;
    checkStamina().then(() => {
      if (useUserStore.getState().stamina <= 0) setShowStaminaModal(true);
    });
  }, [isPreview, checkStamina, isStaminaConsumed, setShowStaminaModal]);

  const quizState: QuizDisplayState = useMemo(
    () => ({
      currentQuestion,
      answerInput,
      displayValue,
      category,
      topic: `${worldParam}-${categoryParam}`,
      categoryParam,
      worldParam,
      subParam: worldParam,
      levelParam,
      gameMode,
      timeLimit: gameMode === 'survival' || gameMode === 'infinite' ? infiniteTimeLimit : timeLimit,
      questionKey,
      timerResetKey,
      totalQuestions: gameState.totalQuestions,
      lives,
      useSystemKeyboard,
      keyboardType,
      activeLandmark,
      remainingPauses,
      altitudePhase,
      isPreview,
    }),
    [
      currentQuestion,
      answerInput,
      displayValue,
      category,
      worldParam,
      categoryParam,
      levelParam,
      gameMode,
      infiniteTimeLimit,
      timeLimit,
      questionKey,
      timerResetKey,
      gameState.totalQuestions,
      lives,
      useSystemKeyboard,
      keyboardType,
      activeLandmark,
      remainingPauses,
      altitudePhase,
      isPreview,
    ]
  );

  const quizAnimations: QuizAnimationState = useMemo(
    () => ({
      isSubmitting,
      isError: animations.isError,
      isPaused:
        showTipModal || showLastChanceModal || showCountdown || isFlarePaused || showPauseModal,
      isInputPaused: showTipModal || showLastChanceModal || showCountdown || showPauseModal,
      showExitConfirm,
      isFadingOut,
      cardAnimation: animations.cardAnimation,
      inputAnimation: animations.inputAnimation,
      questionAnimation: animations.questionAnimation,
      showFlash: animations.showFlash,
      showSlideToast: animations.showSlideToast,
      toastValue,
      damagePosition: animations.damagePosition,
    }),
    [
      isSubmitting,
      animations,
      showTipModal,
      showLastChanceModal,
      showCountdown,
      isFlarePaused,
      showPauseModal,
      showExitConfirm,
      isFadingOut,
      toastValue,
    ]
  );

  const quizHandlers: QuizHandlers = useMemo(
    () => ({
      handleGameOver: stableHandleGameOver,
      handleKeypadNumber,
      handleQwertyKeyPress,
      handleKeypadClear,
      handleKeypadBackspace,
      handleSubmit,
      onPause: () => quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'pause', show: true }),
      onSafetyRopeUsed: () => quizEventBus.emit('QUIZ:SAFETY_ROPE_USED'),
      onLastSpurt: () => quizEventBus.emit('QUIZ:LAST_SPURT'),
      generateNewQuestion: () => generateNewQuestionRef.current(),
    }),
    [
      stableHandleGameOver,
      handleKeypadNumber,
      handleQwertyKeyPress,
      handleKeypadClear,
      handleKeypadBackspace,
      handleSubmit,
      generateNewQuestionRef,
    ]
  );

  const modalState = useMemo(
    () => ({
      showLastChanceModal,
      showCountdown,
      showSafetyRope,
      showTipModal,
      showPauseModal,
      showStaminaModal,
      showTutorial,
      showPromise,
    }),
    [
      showLastChanceModal,
      showCountdown,
      showSafetyRope,
      showTipModal,
      showPauseModal,
      showStaminaModal,
      showTutorial,
      showPromise,
    ]
  );

  const modalHandlers: QuizModalHandlers = useMemo(
    () => ({
      handleRevive: async (useMineral: boolean) => {
        await handleRevive(useMineral);
      },
      handlePurchaseAndRevive,
      handleWatchAdAndRevive,
      handleGiveUp: async () => {
        handleGiveUp();
      },
      handleCountdownComplete,
      setShowSafetyRope,
      handleBack,
      handleStartGame: async (selectedItems: number[]) => {
        await handleStartGame(selectedItems);
      },
      handlePauseResume,
      handlePauseExit,
      setShowStaminaModal,
      onAlertAction,
      handlePromiseComplete,
      setShowTutorial: () => handleTutorialClick(),
    }),
    [
      handleRevive,
      handlePurchaseAndRevive,
      handleWatchAdAndRevive,
      handleGiveUp,
      handleCountdownComplete,
      setShowSafetyRope,
      handleBack,
      handleStartGame,
      handlePauseResume,
      handlePauseExit,
      setShowStaminaModal,
      onAlertAction,
      handlePromiseComplete,
      handleTutorialClick,
    ]
  );

  const value = {
    quizState,
    quizAnimations,
    quizHandlers,
    modalState,
    modalHandlers,
    inputRef,
    feedbackRef,
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
    handleTimeUp,
    setAnswerInput,
    setDisplayValue,
    setShowExitConfirm,
    setIsFadingOut,
    cancelExitConfirm,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}
