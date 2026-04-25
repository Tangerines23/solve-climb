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
import { useQuizGameState } from '@/hooks/useQuizGameState';
import { useQuizAnimations } from '@/hooks/useQuizAnimations';
import { useQuizSubmit } from '@/hooks/useQuizSubmit';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SURVIVAL_CONFIG, CATEGORY_CONFIG, GAME_CONFIG, ANIMATION_CONFIG } from '@/constants/game';
import { useQuizRevive } from '@/hooks/useQuizRevive';
import { useUserStore } from '@/stores/useUserStore';
import { useGameStore } from '@/stores/useGameStore';
import { useToastStore } from '@/stores/useToastStore';
import type { Category, World, QuizQuestion } from '@/types/quiz';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import { useBaseCampStore } from '@/stores/useBaseCampStore';
import { safeAccess } from '@/utils/validation';
import { useQuizBusinessLogic } from '@/hooks/useQuizBusinessLogic';
import { useQuizNavigation } from '@/hooks/useQuizNavigation';
import { useQuizStartLogic } from '@/hooks/useQuizStartLogic';
import { useQuizSession } from '@/hooks/useQuizSession';
import { useQuizGameplay } from '@/hooks/useQuizGameplay';
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

  const score = useQuizStore((state) => state.score);
  const difficulty = useQuizStore((state) => state.difficulty);
  const increaseScore = useQuizStore((state) => state.increaseScore);
  const decreaseScore = useQuizStore((state) => state.decreaseScore);
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

  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [isFlarePaused, setIsFlarePaused] = useState(false);

  const {
    setExhausted,
    resetGame,
    isStaminaConsumed,
    feverLevel,
    lives,
    activeItems,
    usedItems,
    isExhausted,
    consumeActiveItem,
    consumeLife,
  } = useGameStore();

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
    isExhausted: useGameStore.getState().isExhausted,
    navigate,
  });

  const { generateNewQuestion } = useQuestionGenerator({
    category,
    world,
    difficulty,
    gameMode,
    worldParam,
    categoryParam,
    levelParam,
    totalQuestions: gameState.totalQuestions,
    useSystemKeyboard,
    inputRef,
    setCurrentQuestion,
    setAnswerInput,
    setDisplayValue,
    setIsError: animations.setIsError,
    setShowFlash: animations.setShowFlash,
    setQuestionAnimation: animations.setQuestionAnimation,
    setQuestionKey,
    setQuestionStartTime: gameState.setQuestionStartTime,
    onQuestionGenerated: (question) => {
      if (gameMode === 'survival' || gameMode === 'infinite') {
        const { LEVEL_BASE_TIME, PRESSURE_FACTOR } = SURVIVAL_CONFIG.PRESSURE_CONFIG;
        const cat = question.category || '기초';
        const categoryMax =
          (safeAccess(CATEGORY_CONFIG, cat) as { maxLevel: number } | undefined)?.maxLevel ||
          CATEGORY_CONFIG.default.maxLevel;
        const normalizedLv = Math.max(1, Math.ceil((question.level! / categoryMax) * 10));
        const baseTime =
          normalizedLv <= 10
            ? Object.entries(LEVEL_BASE_TIME).find(([k]) => Number(k) === normalizedLv)?.[1] || 10
            : 20 + (normalizedLv - 10) * 2;
        const currentPressure = Math.max(
          PRESSURE_FACTOR.MIN,
          PRESSURE_FACTOR.START - gameState.totalQuestions * PRESSURE_FACTOR.DECAY
        );
        setInfiniteTimeLimit(baseTime * currentPressure);
      }
    },
  });

  const generateNewQuestionRef = useRef(generateNewQuestion);
  useEffect(() => {
    generateNewQuestionRef.current = generateNewQuestion;
  }, [generateNewQuestion]);

  const { handleWatchAdRevive, smartHandleGameOver, handleStaminaAdRecovery } =
    useQuizBusinessLogic({
      setToastValue,
      setShowSlideToast: animations.setShowSlideToast,
      showGlobalToast,
      refundStamina,
      recoverStaminaAds,
      handleGameOver: gameState.handleGameOver,
      totalQuestions: gameState.totalQuestions,
    });

  const {
    showTipModal,
    setShowTipModal,
    showStaminaModal,
    setShowStaminaModal,
    showPromise,
    promiseData,
    activeLandmark,
    altitudePhase,
    handleStartGame,
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
    smartHandleGameOver,
    mountainParam,
    worldParam,
    categoryParam,
    searchParams,
  });

  const { sessionCreated } = useQuizSession({
    showTipModal,
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    setGameSessionId: gameState.setGameSessionId,
  });

  const {
    showCountdown,
    showSafetyRope,
    setShowSafetyRope,
    showPauseModal,
    showTutorial,
    remainingPauses,
    timerResetKey,
    handlePauseClick,
    handleTutorialClick,
    handlePauseResume,
    handlePauseExit,
    handleCountdownComplete,
    handleLastSpurt,
    handleSafetyRopeUsed,
    setShowCountdown,
    setTimerResetKey,
    setShowTutorial,
  } = useQuizGameplay({
    generateNewQuestion: () => generateNewQuestionRef.current(),
    smartHandleGameOver,
    animations,
    setToastValue,
  });

  const handleTimeUp = useCallback(() => {
    const hasSafetyRope = activeItems.includes('safety_rope');
    const hasLastSpurt = gameMode === 'time-attack' && activeItems.includes('last_spurt');

    if (hasSafetyRope) {
      consumeActiveItem('safety_rope');
      handleSafetyRopeUsed();
    } else if (hasLastSpurt) {
      consumeActiveItem('last_spurt');
      handleLastSpurt();
    } else if (gameMode === 'survival') {
      const hasFlare = activeItems.includes('flare');
      if (hasFlare) {
        consumeActiveItem('flare');
        generateNewQuestion();
      } else if (lives > 1) {
        consumeLife();
        generateNewQuestion();
      } else {
        consumeLife();
        gameState.handleGameOver('timeout');
      }
    } else {
      gameState.handleGameOver('timeout');
    }
  }, [
    activeItems,
    gameMode,
    lives,
    consumeActiveItem,
    consumeLife,
    handleSafetyRopeUsed,
    handleLastSpurt,
    generateNewQuestion,
    gameState,
  ]);

  const { handleSubmit } = useQuizSubmit({
    answerInput,
    isSubmitting,
    currentQuestion,
    categoryParam: categoryParam || '',
    subParam: '',
    gameMode,
    questionStartTime: gameState.questionStartTime,
    hapticEnabled,
    useSystemKeyboard,
    setIsSubmitting,
    setCardAnimation: animations.setCardAnimation,
    onSafetyRopeUsed: handleSafetyRopeUsed,
    setInputAnimation: animations.setInputAnimation,
    setDisplayValue,
    setIsError: animations.setIsError,
    setShowFlash: animations.setShowFlash,
    setShowSlideToast: animations.setShowSlideToast,
    setToastValue,
    setDamagePosition: animations.setDamagePosition,
    setAnswerInput,
    increaseScore,
    decreaseScore,
    generateNewQuestion,
    handleGameOver: smartHandleGameOver,
    setTotalQuestions: gameState.setTotalQuestions,
    setWrongAnswers: gameState.setWrongAnswers,
    setSolveTimes: gameState.setSolveTimes,
    inputRef,
    showFeedback: (text, subText, type) => feedbackRef.current?.show(text, subText, type),
    setIsFlarePaused,
    onAnswerSubmitted: (_questionId, userAnswer) => {
      gameState.setUserAnswers((prev) => [...prev, userAnswer]);
      if (gameMode === 'infinite' || gameMode === 'survival') {
        setTotalInfiniteSolved((p) => p + 1);
      }
    },
  });

  const { handleRevive, handlePurchaseAndRevive, handleGiveUp, stableHandleGameOver } =
    useQuizRevive({
      gameMode: gameMode as 'time-attack' | 'survival',
      inventory,
      minerals,
      consumeItem,
      setShowLastChanceModal,
      setTimerResetKey,
      setShowCountdown,
      generateNewQuestion: () => generateNewQuestionRef.current(),
      animations,
      setDisplayValue,
      handleGameOver: smartHandleGameOver,
      setIsSubmitting,
      onWatchAd: handleWatchAdRevive,
      isPreview,
    });

  const handleWatchAdAndRevive = useCallback(async () => {
    const success = await handleWatchAdRevive();
    if (success) {
      await handleRevive(false);
    }
  }, [handleWatchAdRevive, handleRevive]);

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

  useEffect(() => {
    if (isPreview || isStaminaConsumed) return;
    checkStamina().then(() => {
      if (useUserStore.getState().stamina <= 0) setShowStaminaModal(true);
    });
  }, [isPreview, checkStamina, isStaminaConsumed, setShowStaminaModal]);

  const handleKeypadNumber = useCallback(
    (key: string) => {
      if (answerInput.length >= GAME_CONFIG.MAX_ANSWER_LENGTH_KEYPAD) return;
      let newValue = answerInput;
      if (key === '.') {
        if (answerInput.includes('.')) return;
        newValue =
          answerInput === '' || answerInput === '-' ? answerInput + '0.' : answerInput + '.';
      } else if (key === '-') {
        newValue = answerInput === '' ? '-' : answerInput === '-' ? '' : answerInput;
      } else {
        newValue = answerInput + key;
      }
      setAnswerInput(newValue);
      setDisplayValue(newValue);
    },
    [answerInput]
  );

  const handleQwertyKeyPress = useCallback((k: string) => {
    setAnswerInput((p) => (p + k).slice(0, GAME_CONFIG.MAX_ANSWER_LENGTH_KEYBOARD));
    setDisplayValue((p) => (p + k).slice(0, GAME_CONFIG.MAX_ANSWER_LENGTH_KEYBOARD));
  }, []);

  const handleKeypadClear = useCallback(() => {
    setAnswerInput('');
    setDisplayValue('');
  }, []);

  const handleKeypadBackspace = useCallback(() => {
    setAnswerInput((p) => p.slice(0, -1));
    setDisplayValue((p) => p.slice(0, -1));
  }, []);

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
      onSafetyRopeUsed: handleSafetyRopeUsed,
      onLastSpurt: handleLastSpurt,
      onPause: handlePauseClick,
      generateNewQuestion,
      handleSubmit: (e?: React.FormEvent) => handleSubmit(e as React.FormEvent),
      handleGameOver: stableHandleGameOver,
      handleKeypadNumber,
      handleQwertyKeyPress,
      handleKeypadClear,
      handleKeypadBackspace,
    }),
    [
      handleSafetyRopeUsed,
      handleLastSpurt,
      handlePauseClick,
      generateNewQuestion,
      handleSubmit,
      stableHandleGameOver,
      handleKeypadNumber,
      handleQwertyKeyPress,
      handleKeypadClear,
      handleKeypadBackspace,
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
