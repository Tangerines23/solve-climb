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
import { useDebugStore } from '@/stores/useDebugStore';
import { useQuestionGenerator } from '../hooks/useQuestionGenerator';
import { useQuizInput } from '../hooks/useQuizInput';
import { useQuizGameState } from '../hooks/useQuizGameState';
import { useQuizAnimations } from '../hooks/useQuizAnimations';
import { useQuizSubmit } from '../hooks/useQuizSubmit';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SURVIVAL_CONFIG, CATEGORY_CONFIG, ANIMATION_CONFIG } from '@/constants/game';
import { useQuizRevive } from '../hooks/useQuizRevive';
import { useUserStore } from '@/stores/useUserStore';
import { useGameStore } from '@/stores/useGameStore';
import { useToastStore } from '@/stores/useToastStore';
import type { Category, World, QuizQuestion } from '../types/quiz';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import { useBaseCampStore } from '@/stores/useBaseCampStore';
import { safeAccess } from '@/utils/validation';
import { useQuizBusinessLogic } from '../hooks/useQuizBusinessLogic';
import { useQuizNavigation } from '../hooks/useQuizNavigation';
import { useQuizStartLogic } from '../hooks/useQuizStartLogic';
import { useQuizSession } from '../hooks/useQuizSession';
import { useQuizGameplay } from '../hooks/useQuizGameplay';
import { quizEventBus } from '@/lib/eventBus';
import { setupQuizEventListeners } from '../services/quizEventListener';
import { useQuizFeedback } from '../hooks/useQuizFeedback';
import { useQuizBgm } from '../hooks/useQuizBgm';
import { useDeathNoteStore } from '@/stores/useDeathNoteStore';
import { vibrateLong } from '@/utils/haptic';
import {
  QuizDisplayState,
  QuizAnimationState,
  QuizHandlers,
  QuizModalHandlers,
} from '../types/quizProps';

interface QuizContextType {
  quizState: QuizDisplayState;
  quizAnimations: QuizAnimationState;
  quizHandlers: QuizHandlers;
  modalState: any;
  modalHandlers: QuizModalHandlers;
  inputRef: React.RefObject<HTMLInputElement | null>;
  feedbackRef: React.RefObject<ItemFeedbackRef | null>;
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
  const { triggerSuccessFeedback, triggerWrongFeedback } = useQuizFeedback();

  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPromise, setShowPromise] = useState(false);
  const [showStaminaModal, setShowStaminaModal] = useState(false);
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
  const [showTipModal, setShowTipModal] = useState(!isPreview);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<ItemFeedbackRef>(null);

  useEffect(() => {
    const cleanupListeners = setupQuizEventListeners();
    return cleanupListeners;
  }, []);

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
    setShowStaminaModal,
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

  const {
    handleRevive,
    handlePurchaseAndRevive,
    handleGiveUp,
    stableHandleGameOver,
    hasUsedLastChance,
  } = useQuizRevive({
    gameMode: gameMode as 'time-attack' | 'survival',
    inventory,
    minerals,
    consumeItem,
    onWatchAd: handleWatchAdRevive,
    isPreview,
  });

  const handleWatchAdAndRevive = useCallback(async () => {
    const success = await handleWatchAdRevive();
    if (success) {
      await handleRevive(false);
    }
  }, [handleWatchAdRevive, handleRevive]);

  useQuizBgm({
    categoryParam,
    modeParam,
    showTipModal,
    showLastChanceModal,
    showCountdown,
    showPauseModal,
    isLastSpurtActive: hasUsedLastChance,
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
        stableHandleGameOver('timeout');
      }
    } else {
      stableHandleGameOver('timeout');
    }
  }, [activeItems, gameMode, lives, consumeActiveItem, consumeLife, stableHandleGameOver]);

  const { handleSubmit: originalSubmit } = useQuizSubmit({
    answerInput,
    isSubmitting,
    currentQuestion,
    categoryParam: categoryParam || '',
    subParam: worldParam || '',
    gameMode,
    questionStartTime: gameState.questionStartTime,
    currentQuestionId,
  });

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const isAdmin = useDebugStore.getState().isAdminMode;
      if (isAdmin && currentQuestion && (!answerInput || answerInput.trim() === '')) {
        const correctAnswer = String(currentQuestion.answer);
        setAnswerInput(correctAnswer);
        setDisplayValue(correctAnswer);

        setTimeout(() => {
          originalSubmit();
        }, 50);
        return;
      }
      originalSubmit(e);
    },
    [originalSubmit, currentQuestion, answerInput, setAnswerInput, setDisplayValue]
  );

  const { handleKeypadNumber, handleQwertyKeyPress, handleKeypadClear, handleKeypadBackspace } =
    useQuizInput({
      isSubmitting,
      isError: animations.isError,
      isPaused:
        showTipModal ||
        showLastChanceModal ||
        showCountdown ||
        isFlarePaused ||
        showPauseModal ||
        showStaminaModal,
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
      const currentStamina = useUserStore.getState().stamina;
      if (currentStamina <= 0) {
        setExhausted(true);
      } else {
        setExhausted(false);
      }
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
    // quizEventBus 구독 설정
    const unsubscribeAnswer = quizEventBus.on('QUIZ:ANSWER_SUBMITTED', (data) => {
      const { isCorrect, score: earnedDistance, solveTime, answer } = data;

      // 1. 공통 데이터 업데이트
      const formattedAnswer =
        !isNaN(Number(answer)) && answer.trim() !== '' ? Number(answer) : answer;
      gameState.setUserAnswers((prev) => [...prev, formattedAnswer]);
      gameState.setSolveTimes((p) => [...p, solveTime]);
      gameState.setTotalQuestions((p) => p + 1);

      if (currentQuestionId) {
        gameState.setQuestionIds((prev) => [...prev, currentQuestionId]);
      }

      if (gameMode === 'infinite' || gameMode === 'survival') {
        setTotalInfiniteSolved((p) => p + 1);
      }

      // 2. 결과에 따른 처리
      if (isCorrect) {
        increaseScore(earnedDistance);
        useGameStore.getState().incrementCombo(levelParam ?? undefined);

        animations.setCardAnimation('correct-flash');
        animations.setShowFlash(true);

        // 카드 내 플로팅 피드백 효과 연동 (무작위 위치 생성)
        triggerSuccessFeedback(
          earnedDistance,
          {
            setToastValue,
            setDamagePosition: animations.setDamagePosition,
            setShowSlideToast: animations.setShowSlideToast,
            setShowFlash: animations.setShowFlash,
          },
          hapticEnabled
        );

        // 중복 피드백 제거: 플로팅 연출 집중을 위해 외곽의 투명한 성공 메시지 토스트를 비활성화합니다.
        // feedbackRef.current?.show('SUCCESS', `+${earnedDistance}m`, 'success');
      } else {
        const hadSafetyRope = useGameStore.getState().activeItems.includes('safety_rope');
        if (hadSafetyRope) {
          quizEventBus.emit('QUIZ:SAFETY_ROPE_USED');
          setToastValue('🔗 안전 로프 발동! 콤보 보호');
        } else {
          decreaseScore(earnedDistance);
        }
        useGameStore.getState().resetCombo();

        animations.setCardAnimation('wrong-shake');
        animations.setIsError(true);

        // 카드 내 플로팅 피드백 효과 연동 (오답 경고 플래시 및 무작위 위치 생성)
        triggerWrongFeedback(
          'Wrong Answer',
          {
            setToastValue,
            setDamagePosition: animations.setDamagePosition,
            setShowSlideToast: animations.setShowSlideToast,
            setShowFlash: animations.setShowFlash,
          },
          hapticEnabled
        );

        // 중복 피드백 제거: 오답 시 외곽의 투명한 실패 메시지 토스트를 비활성화합니다.
        // feedbackRef.current?.show('FAILURE', 'Wrong Answer', 'info'); // 'error' 대신 'info' 또는 'success'

        // DeathNote
        if (currentQuestion) {
          useDeathNoteStore
            .getState()
            .addMissedQuestion(
              currentQuestion,
              (worldParam as any) || 'World1',
              (categoryParam as any) || '기초'
            );
          gameState.setWrongAnswers((prev: any) => [...prev, currentQuestion]);
        }

        // Survival Mode life management
        if (gameMode === 'survival') {
          if (lives > 1) {
            consumeLife();
          } else {
            consumeLife();
            stableHandleGameOver('death');
            return; // Don't proceed to next question
          }
        }
      }

      // 3. BaseCamp logic
      if (modeParam === 'base-camp') {
        useBaseCampStore.getState().submitAnswer(isCorrect, solveTime);
      }

      // 4. Cleanup and Next Question
      setTimeout(() => {
        setAnswerInput('');
        setDisplayValue('');
        setIsSubmitting(false);
        animations.setIsError(false);
        animations.setCardAnimation('');

        // If not game over, request next question
        quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
      }, 800);
    });

    // 다음 문제 요청 구독
    const unsubscribeNext = quizEventBus.on('QUIZ:NEXT_QUESTION_REQUESTED', () => {
      generateNewQuestionRef.current();
    });

    // 문제 생성 완료 구독
    const unsubscribeQuestion = quizEventBus.on('QUIZ:QUESTION_GENERATED', (data) => {
      const { question, questionId } = data;

      animations.setQuestionAnimation('fade-out');

      setTimeout(() => {
        setCurrentQuestion(question);
        setCurrentQuestionId(questionId);
        setAnswerInput('');
        setDisplayValue('');
        animations.setIsError(false);
        animations.setShowFlash(false);
        animations.setQuestionAnimation('fade-in');

        if (gameMode === 'survival' || gameMode === 'infinite') {
          setQuestionKey((prev) => prev + 1);
          gameState.setQuestionStartTime(Date.now());

          // Time limit calculation for survival/infinite
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

        if (useSystemKeyboard && inputRef.current) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, ANIMATION_CONFIG.KEYBOARD_FOCUS_DELAY);
        }
      }, ANIMATION_CONFIG.TRANSITION_DELAY);
    });

    // 제출 시작 구독
    const unsubscribeSubmissionStarted = quizEventBus.on('QUIZ:SUBMISSION_STARTED', () => {
      setIsSubmitting(true);
    });

    // 부활 성공 구독
    const unsubscribeReviveSuccess = quizEventBus.on('QUIZ:REVIVE_SUCCESS', () => {
      setIsSubmitting(false);
      animations.setIsError(false);
      setDisplayValue('');
    });

    // UI 모달 토글 구독
    const unsubscribeModalToggle = quizEventBus.on('QUIZ:UI_MODAL_TOGGLE', (data) => {
      const { modal, show } = data;
      switch (modal) {
        case 'lastChance':
          setShowLastChanceModal(show);
          break;
        case 'countdown':
          setShowCountdown(show);
          break;
        case 'safetyRope':
          setShowSafetyRope(show);
          break;
        case 'tip':
          setShowTipModal(show);
          break;
        case 'pause':
          setShowPauseModal(show);
          break;
        case 'stamina':
          setShowStaminaModal(show);
          break;
        case 'tutorial':
          setShowTutorial(show);
          break;
        case 'promise':
          setShowPromise(show);
          break;
      }
    });

    // 잘못된 입력 구독
    const unsubscribeInvalid = quizEventBus.on('QUIZ:INVALID_INPUT', () => {
      animations.setIsError(true);
      if (hapticEnabled) vibrateLong();
      setTimeout(() => {
        animations.setIsError(false);
        setIsSubmitting(false);
      }, 500);
    });

    // 게임 종료 구독
    const unsubscribeGameOver = quizEventBus.on('QUIZ:GAME_OVER', (data) => {
      smartHandleGameOver(data?.reason);
    });

    // 타이머 종료 구독
    const unsubscribeTimerUp = quizEventBus.on('QUIZ:TIMER_UP', () => {
      handleTimeUp();
    });

    // 페널티 구독
    const unsubscribePenalty = quizEventBus.on('QUIZ:PENALTY', (data) => {
      useQuizStore.getState().decreaseScore(data.amount);
    });

    return () => {
      unsubscribeAnswer();
      unsubscribeNext();
      unsubscribeQuestion();
      unsubscribeSubmissionStarted();
      unsubscribeReviveSuccess();
      unsubscribeModalToggle();
      unsubscribeInvalid();
      unsubscribeGameOver();
      unsubscribeTimerUp();
      unsubscribePenalty();
    };
  }, [
    gameMode,
    currentQuestionId,
    gameState,
    smartHandleGameOver,
    handleTimeUp,
    increaseScore,
    decreaseScore,
    animations,
    hapticEnabled,
    lives,
    consumeLife,
    modeParam,
    currentQuestion,
    setAnswerInput,
    setDisplayValue,
    setIsSubmitting,
    categoryParam,
    worldParam,
    useSystemKeyboard,
  ]);

  useEffect(() => {
    if (isPreview || isStaminaConsumed) return;
    checkStamina().then(() => {
      if (useUserStore.getState().stamina <= 0) setShowStaminaModal(true);
    });
  }, [isPreview, checkStamina, isStaminaConsumed, setShowStaminaModal]);

  // 인게임 치트 단축키 (DEV 환경 & Admin Mode 전용)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleCheatKeyDown = (e: KeyboardEvent) => {
      const isAdmin = useDebugStore.getState().isAdminMode;
      if (!isAdmin || !currentQuestion) return;

      const key = e.key.toLowerCase();

      if (key === 'v') {
        e.preventDefault();
        e.stopPropagation();

        const correctAnswer = String(currentQuestion.answer);

        setAnswerInput(correctAnswer);
        setDisplayValue(correctAnswer);

        // 실제 정답을 입력 후 50ms 후 제출 실행
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(fakeEvent);
        }, 50);
      } else if (key === 'backspace') {
        e.preventDefault();
        e.stopPropagation();

        const wrongAnswer = String(currentQuestion.answer) + '9'; // 오답 세팅

        setAnswerInput(wrongAnswer);
        setDisplayValue(wrongAnswer);

        // 틀린 오답을 입력 후 50ms 후 제출 실행
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(fakeEvent);
        }, 50);
      }
    };

    window.addEventListener('keydown', handleCheatKeyDown, true); // 캡처링 리스너 적용
    return () => window.removeEventListener('keydown', handleCheatKeyDown, true);
  }, [currentQuestion, setAnswerInput, setDisplayValue, handleSubmit]);

  const quizState: QuizDisplayState = useMemo(
    () => ({
      currentQuestion,
      answerInput,
      displayValue,
      category,
      topic: `${worldParam}-${categoryParam}`,
      mountainParam,
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
        showTipModal ||
        showLastChanceModal ||
        showCountdown ||
        isFlarePaused ||
        showPauseModal ||
        showStaminaModal,
      isInputPaused:
        showTipModal || showLastChanceModal || showCountdown || showPauseModal || showStaminaModal,
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
      showStaminaModal,
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
      handleStartGame: async (selectedItems: number[], forceExhausted?: boolean) => {
        await handleStartGame(selectedItems, forceExhausted);
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
