import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './QuizPage.css';
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
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
} from '@/utils/urlParams';
import { QuizPreview } from '@/components/quiz/QuizPreview';
import { useBaseCampStore } from '@/stores/useBaseCampStore';
import { TutorialStep } from '@/components/tutorial/TutorialOverlay';
import { safeAccess } from '@/utils/validation';
import { useQuizBusinessLogic } from '@/hooks/useQuizBusinessLogic';
import { useQuizNavigation } from '@/hooks/useQuizNavigation';
import { useQuizStartLogic } from '@/hooks/useQuizStartLogic';
import { useQuizSession } from '@/hooks/useQuizSession';
import { useQuizGameplay } from '@/hooks/useQuizGameplay';
import { TUTORIAL_STEPS } from '@/constants/ui';
import { storageService, STORAGE_KEYS } from '@/services';
import { QuizLayout } from '@/components/quiz/QuizLayout';
import { QuizDisplayState, QuizAnimationState, QuizHandlers } from '@/types/quizProps';

export function QuizPage() {
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
  const [searchParams] = useSearchParams();

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
  } = useUserStore();

  const { showToast: showGlobalToast } = useToastStore();
  const animations = useQuizAnimations();

  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [isFlarePaused, setIsFlarePaused] = useState(false);

  // [Base Camp Tutorial]
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialSteps: TutorialStep[] = TUTORIAL_STEPS as unknown as TutorialStep[];

  const { setExhausted, resetGame, isStaminaConsumed, feverLevel, lives } = useGameStore();

  const [questionKey, setQuestionKey] = useState(0);
  const [previewKeyboardType] = useState<'custom' | 'qwerty'>(() => keyboardType);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<ItemFeedbackRef>(null);

  const worldParam = validateWorldParam(searchParams.get('world'));
  const categoryParam = validateCategoryInWorldParam(worldParam, searchParams.get('category'));
  const levelParam = validateLevelParam(searchParams.get('level'), 20);
  const modeParam = validateModeParam(searchParams.get('mode'));
  const isPreview = searchParams.get('preview') === 'true';

  const gameState = useQuizGameState({
    score,
    gameMode,
    mountainParam: searchParams.get('mountain'),
    worldParam,
    categoryParam,
    subParam: worldParam,
    levelParam,
    modeParam,
    isExhausted: useGameStore.getState().isExhausted,
    navigate,
  });

  useEffect(() => {
    const mountain = searchParams.get('mountain');
    if (mountain) storageService.set(STORAGE_KEYS.LAST_VISITED_MOUNTAIN, mountain);
    if (worldParam) storageService.set(STORAGE_KEYS.LAST_VISITED_WORLD, worldParam);
    if (categoryParam) storageService.set(STORAGE_KEYS.LAST_VISITED_CATEGORY, categoryParam);
  }, [worldParam, categoryParam, searchParams]);

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

  const { showExitConfirm, isFadingOut, handleBack } = useQuizNavigation({
    totalQuestions: gameState.totalQuestions,
    showTipModal,
    refundStamina,
    navigate,
    smartHandleGameOver,
    mountainParam: searchParams.get('mountain'),
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
    remainingPauses,
    timerResetKey,
    handlePauseClick,
    handlePauseResume,
    handlePauseExit,
    handleCountdownComplete,
    handleLastSpurt,
    handleSafetyRopeUsed,
    setShowCountdown,
    setTimerResetKey,
  } = useQuizGameplay({
    generateNewQuestion: () => generateNewQuestionRef.current(),
    smartHandleGameOver,
    animations,
    setToastValue,
  });

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
      minerals: useUserStore.getState().minerals,
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

  const quizState: QuizDisplayState = {
    currentQuestion,
    answerInput,
    displayValue,
    category,
    topic: `${worldParam}-${categoryParam}`,
    categoryParam,
    subParam: worldParam,
    levelParam,
    gameMode,
    timeLimit: gameMode === 'survival' || gameMode === 'infinite' ? infiniteTimeLimit : timeLimit,
    questionKey,
    timerResetKey,
    totalQuestions: gameState.totalQuestions,
    lives,
    useSystemKeyboard,
    activeLandmark,
    remainingPauses,
    altitudePhase,
  };

  const quizAnimations: QuizAnimationState = {
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
  };

  const quizHandlers: QuizHandlers = {
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
  };

  const modalState = {
    showLastChanceModal,
    showCountdown,
    showSafetyRope,
    showTipModal,
    showPauseModal,
    showStaminaModal,
    showTutorial,
    showPromise,
  };

  const modalHandlers = {
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
    setShowTutorial: (val: boolean) => setShowTutorial(val),
  };

  if (isPreview)
    return (
      <QuizPreview
        categoryParam={categoryParam || ''}
        subParam={worldParam || ''}
        levelParam={levelParam}
        category={category || '기초'}
        topic={`${worldParam}-${categoryParam}`}
        keyboardType={previewKeyboardType}
        navigate={navigate}
        useSystemKeyboard={useSystemKeyboard}
      />
    );

  return (
    <QuizLayout
      quizState={quizState}
      quizAnimations={quizAnimations}
      quizHandlers={quizHandlers}
      inputRef={inputRef}
      feedbackRef={feedbackRef}
      modalState={modalState}
      modalHandlers={modalHandlers}
      inventory={inventory}
      minerals={useUserStore.getState().minerals}
      isAnonymous={isAnonymous}
      feverLevel={feverLevel}
      altitudePhase={altitudePhase}
      promiseData={promiseData}
      tutorialSteps={tutorialSteps}
    />
  );
}
