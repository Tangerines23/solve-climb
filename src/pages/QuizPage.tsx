// src/pages/QuizPage.tsx (범용 퀴즈 페이지)
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './QuizPage.css';
import { useQuizStore, type TimeLimit } from '@/stores/useQuizStore';
import { QuizCard } from '@/components/QuizCard';
import { useQuestionGenerator } from '@/hooks/useQuestionGenerator';
import { useQuizInput } from '@/hooks/useQuizInput';
import { useQuizGameState } from '@/hooks/useQuizGameState';
import { useQuizAnimations } from '@/hooks/useQuizAnimations';
import { useQuizSubmit } from '@/hooks/useQuizSubmit';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { LANDMARK_MAPPING, SURVIVAL_CONFIG } from '@/constants/game';
import { useQuizRevive } from '@/hooks/useQuizRevive';
import { useUserStore } from '@/stores/useUserStore';
import { useGameStore } from '@/stores/useGameStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { useToastStore } from '@/stores/useToastStore';
import type { Category, World } from '@/types/quiz';
import { AdService } from '@/utils/adService';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import { analytics } from '@/services/analytics';
import { supabase } from '@/utils/supabaseClient';
import { debugSupabaseQuery } from '@/utils/debugFetch';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
} from '@/utils/urlParams';
import { QuizQuestion } from '@/types/quiz';
import { QuizPreview } from '@/components/quiz/QuizPreview';
import { QuizModals } from '@/components/quiz/QuizModals';
import { urls } from '@/utils/navigation';
import { useBaseCampStore } from '@/stores/useBaseCampStore';
import { TodaysPromise } from '@/components/quiz/TodaysPromise';
import { FeverEffect } from '@/components/effects/FeverEffect';
import { LOGIC_PROMISES } from '@/constants/promises';
import { TutorialOverlay, TutorialStep } from '@/components/tutorial/TutorialOverlay';

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
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const lives = useGameStore((state) => state.lives);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [toastValue, setToastValue] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [useSystemKeyboard] = useState(false);
  const [showTipModal, setShowTipModal] = useState(true);
  const [showStaminaModal, setShowStaminaModal] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState<number[]>([]);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [infiniteTimeLimit, setInfiniteTimeLimit] = useState(10);

  const [totalInfiniteSolved, setTotalInfiniteSolved] = useState(0);

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

  const handleStaminaAdRecovery = useCallback(async () => {
    animations.setShowSlideToast(true);
    setToastValue('광고 시청 중... 📺');

    const adResult = await AdService.showRewardedAd('stamina_recharge');

    if (adResult.success) {
      const result = await recoverStaminaAds();
      if (result.success) {
        setShowStaminaModal(false);
        animations.setShowSlideToast(true);
        setToastValue('산소통(스태미나)이 충전되었습니다! 🫧');
        setTimeout(() => window.location.reload(), 500);
      } else {
        setToastValue('충전 실패: ' + result.message);
      }
    } else {
      setToastValue('광고 시청 실패: ' + (adResult.error || '잠시 후 다시 시도해주세요.'));
    }
  }, [animations, recoverStaminaAds]);

  const handleWatchAdRevive = useCallback(async () => {
    animations.setShowSlideToast(true);
    setToastValue('광고 시청 중... 📺');

    const adResult = await AdService.showRewardedAd('revive');

    if (adResult.success) {
      animations.setShowSlideToast(true);
      setToastValue('광고 시청 완료! 부활합니다. 🫧');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true; // 성공 보답
    } else {
      setToastValue('광고 시청 실패: ' + (adResult.error || '잠시 후 다시 시도해주세요.'));
      return false;
    }
  }, [animations]);

  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isFlarePaused, setIsFlarePaused] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [remainingPauses, setRemainingPauses] = useState(3);
  const [showPromise, setShowPromise] = useState(false);
  const [promiseData, setPromiseData] = useState({ rule: '', example: '' });

  // [Base Camp Tutorial]
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialSteps: TutorialStep[] = [
    { targetId: 'quiz-display', text: '환영합니다! 지금부터 10문제를 풀어보세요.', action: 'read' },
    { targetId: 'keypad', text: '정답을 입력하고 엔터를 누르면 됩니다.', action: 'tap' },
    { targetId: 'timer-bar', text: '시간은 측정되지만 제한은 없습니다.', action: 'read' },
  ];

  const {
    setExhausted,
    resetGame,
    setActiveItems,
    incrementCombo,
    isStaminaConsumed,
    setStaminaConsumed,
  } = useGameStore();

  const [questionKey, setQuestionKey] = useState(0);

  const [previewKeyboardType] = useState<'custom' | 'qwerty'>(() => keyboardType);

  const [exitConfirmTimeoutRef] = useState(() => ({ current: null as NodeJS.Timeout | null }));
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<ItemFeedbackRef>(null);

  // URL 파라미터 파싱 및 검증
  const worldParamRaw = searchParams.get('world');
  const categoryParamRaw = searchParams.get('category');
  const mountainParam = searchParams.get('mountain');

  const levelParamRaw = searchParams.get('level');
  const modeParamRaw = searchParams.get('mode');

  const worldParam = validateWorldParam(worldParamRaw);
  const categoryParam = validateCategoryInWorldParam(worldParam, categoryParamRaw);
  const levelParam = validateLevelParam(levelParamRaw, 20);
  const modeParam = validateModeParam(modeParamRaw);
  const isPreview = searchParams.get('preview') === 'true';

  const gameState = useQuizGameState({
    score,
    gameMode,
    mountainParam,
    worldParam,
    categoryParam,
    subParam: worldParam, // subParam은 worldParam과 동일
    levelParam,
    modeParam,
    isExhausted: useGameStore.getState().isExhausted,
    navigate,
  });

  // [Phase 8] Persistence for Resilience
  useEffect(() => {
    if (mountainParam) localStorage.setItem('last_visited_mountain', mountainParam);
    if (worldParam) localStorage.setItem('last_visited_world', worldParam);
    if (categoryParam) localStorage.setItem('last_visited_category', categoryParam);
  }, [mountainParam, worldParam, categoryParam]);

  // v2.2 Landmark Popups
  const [activeLandmark, setActiveLandmark] = useState<{ icon: string; text: string } | null>(null);

  // landmarkMapping extracted to constants/game.ts

  useEffect(() => {
    if (gameMode !== 'survival') return;
    const altitude = gameState.totalQuestions * 10;
    const landmark = LANDMARK_MAPPING[altitude as keyof typeof LANDMARK_MAPPING];
    if (landmark) {
      setActiveLandmark(landmark);
      setTimeout(() => setActiveLandmark(null), 2500);
    }
  }, [gameState.totalQuestions, gameMode]);

  // v2.2 Altitude-based Background Phase calculation
  const altitudePhase = useMemo(() => {
    if (gameMode !== 'survival') return 'forest';
    const altitude = gameState.totalQuestions * 10;
    if (altitude < 500) return 'forest';
    if (altitude < 1500) return 'rock';
    if (altitude < 3000) return 'clouds';
    return 'space';
  }, [gameState.totalQuestions, gameMode]);

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
    onQuestionGenerated: (question, questionId) => {
      gameState.setQuestionIds((prev) => [...prev, questionId]);

      // v2.2 Smart Pressure Timer Logic
      if (gameMode === 'survival' || gameMode === 'infinite') {
        const { LEVEL_BASE_TIME, PRESSURE_FACTOR } = SURVIVAL_CONFIG.PRESSURE_CONFIG;

        // 1. 현재 레벨 기반 Base Time 결정 (v2.4 고해상도 매핑)
        const categoryMax =
          question.category === '기초'
            ? 30
            : question.category === '논리'
              ? 15
              : question.category === '대수'
                ? 20
                : question.category === '심화'
                  ? 15
                  : 10;

        // 기획서 10레벨 기준을 30레벨까지 확장 가능하도록 매핑
        const normalizedLv = Math.max(1, Math.ceil((question.level! / categoryMax) * 10));

        // v2.4: 10레벨 초과 시 선형 증가 로직 (Lv.30 -> 60초+ 보장)
        const getBaseTime = (lv: number) => {
          if (lv <= 10) return LEVEL_BASE_TIME[lv] || 10;
          return 20 + (lv - 10) * 2; // 10레벨 이후 초당 2초씩 증가
        };

        const baseTime = getBaseTime(normalizedLv);

        // 2. Pressure Factor 계산 (문제 수에 따라 감소)
        const currentPressure = Math.max(
          PRESSURE_FACTOR.MIN,
          PRESSURE_FACTOR.START - gameState.totalQuestions * PRESSURE_FACTOR.DECAY
        );

        const calculatedTime = baseTime * currentPressure;
        setInfiniteTimeLimit(calculatedTime);
      }
    },
  });

  const generateNewQuestionRef = useRef(generateNewQuestion);
  useEffect(() => {
    generateNewQuestionRef.current = generateNewQuestion;
  }, [generateNewQuestion]);

  const handleFlareInputStart = useCallback(() => {
    if (isFlarePaused) setIsFlarePaused(false);
  }, [isFlarePaused]);

  const isTimerPaused =
    showTipModal || showLastChanceModal || showCountdown || isFlarePaused || showPauseModal;
  const isInputPaused = showTipModal || showLastChanceModal || showCountdown || showPauseModal;

  useQuizInput({
    answerInput,
    isSubmitting,
    isError: animations.isError,
    isPaused: isInputPaused,
    categoryParam: categoryParam || '',
    subParam: '',
    setAnswerInput,
    setDisplayValue,
    onInputStart: handleFlareInputStart,
  });

  const gameStateSettersRef = useRef({
    handleGameOver: gameState.handleGameOver,
    setTotalQuestions: gameState.setTotalQuestions,
    setWrongAnswers: gameState.setWrongAnswers,
    setSolveTimes: gameState.setSolveTimes,
  });
  useEffect(() => {
    gameStateSettersRef.current = {
      handleGameOver: gameState.handleGameOver,
      setTotalQuestions: gameState.setTotalQuestions,
      setWrongAnswers: gameState.setWrongAnswers,
      setSolveTimes: gameState.setSolveTimes,
    };
  }, [
    gameState.handleGameOver,
    gameState.setTotalQuestions,
    gameState.setWrongAnswers,
    gameState.setSolveTimes,
  ]);

  const handleGameOverRef = useRef(gameState.handleGameOver);
  useEffect(() => {
    handleGameOverRef.current = gameState.handleGameOver;
  }, [gameState.handleGameOver]);

  const revive = useQuizRevive({
    gameMode: gameMode as 'time-attack' | 'survival',
    inventory,
    minerals: useUserStore.getState().minerals,
    consumeItem,
    setShowLastChanceModal,
    setTimerResetKey,
    setShowCountdown,
    generateNewQuestion: generateNewQuestionRef.current,
    animations,
    setDisplayValue,
    handleGameOver: handleGameOverRef.current,
    setIsSubmitting,
    onWatchAd: handleWatchAdRevive,
    isPreview,
  });

  const { handleRevive, handlePurchaseAndRevive, handleGiveUp, stableHandleGameOver } = revive;

  // 광고 보상 콜백과 부활 로직을 하나로 묶음
  const handleWatchAdAndRevive = useCallback(async () => {
    const success = await handleWatchAdRevive();
    if (success) {
      await handleRevive(false);
    }
  }, [handleWatchAdRevive, handleRevive]);

  const smartHandleGameOver = useCallback(
    async (reason?: string) => {
      if (gameState.totalQuestions === 0 && (reason === 'timeout' || reason === 'manual_exit')) {
        try {
          const res = await refundStamina();
          if (res.success) {
            showGlobalToast('첫 문제 도전 실패로 스태미나가 반환되었습니다.', '🫧');
          }
        } catch (error) {
          console.error('[QuizPage] Refund error:', error);
        }
      }
      stableHandleGameOver(reason);
    },
    [gameState.totalQuestions, refundStamina, stableHandleGameOver, showGlobalToast]
  );

  const showExitConfirmRef = useRef(false);

  const handleBack = useCallback(() => {
    // 1. 아직 한 문제도 풀지 않았거나 팁 화면인 경우, 확인 없이 바로 섹션 선택으로 이동
    if (gameState.totalQuestions === 0 || showTipModal) {
      if (exitConfirmTimeoutRef.current) clearTimeout(exitConfirmTimeoutRef.current);

      // 환불 로직 실행
      refundStamina().catch(console.error);

      // 이전 선택 화면으로 이동
      if (mountainParam && worldParam && categoryParam) {
        navigate(
          urls.levelSelect({
            mountain: mountainParam,
            world: worldParam,
            category: categoryParam as Category,
          }),
          { replace: true }
        );
      } else {
        navigate(urls.home(), { replace: true });
      }
      return;
    }

    // 2. 게임 도중인 경우 안전 장치(2번 누르기) 작동
    if (showExitConfirmRef.current) {
      if (exitConfirmTimeoutRef.current) clearTimeout(exitConfirmTimeoutRef.current);
      smartHandleGameOver('manual_exit');
    } else {
      setToastValue('뒤로 가려면 한 번 더 누르세요');
      setShowExitConfirm(true);
      showExitConfirmRef.current = true;
      setTimeout(() => setIsFadingOut(true), 2500);
      exitConfirmTimeoutRef.current = setTimeout(() => {
        setShowExitConfirm(false);
        showExitConfirmRef.current = false;
        setIsFadingOut(false);
      }, 3000);
    }
  }, [
    gameState.totalQuestions,
    showTipModal,
    refundStamina,
    mountainParam,
    worldParam,
    categoryParam,
    navigate,
    smartHandleGameOver,
  ]);

  // 브라우저 뒤로가기 가로채기 및 UI 뒤로가기(handleBack)와 동기화
  useEffect(() => {
    // 빌드 타임 혹은 초기 팁 화면에서는 가로채지 않음 (자유로운 이탈 허용)
    if (showTipModal) return;

    // 퀴즈 진행 중일 때만 히스토리 스택에 더미 상태 추가
    window.history.pushState({ protected: true }, '', window.location.href);

    const handlePopState = () => {
      // popstate가 발생했다는 것은 브라우저가 이미 한 단계 뒤로 이동했다는 뜻 (dummy -> original)
      handleBack();
      // 강제로 다시 dummy를 밀어넣어 페이지 유지
      window.history.pushState({ protected: true }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBack, showTipModal]);

  const handlePauseClick = useCallback(() => {
    if (remainingPauses > 0) setShowPauseModal(true);
    else
      feedbackRef.current?.show('일시정지 횟수 초과!', '더 이상 일시정지할 수 없습니다.', 'info');
  }, [remainingPauses]);

  const handlePauseResume = useCallback(() => {
    setRemainingPauses((prev) => prev - 1);
    generateNewQuestionRef.current();
    setShowPauseModal(false);
    setShowCountdown(true); // v2.2: Reroll + Countdown on resume
    feedbackRef.current?.show('START!', '3... 2... 1...', 'info');
  }, []);

  const handlePauseExit = useCallback(() => {
    setShowPauseModal(false);
    // 그만하기 클릭 시에도 환불 로직 보장 위해 smartHandleGameOver 호출
    smartHandleGameOver('manual_exit');
  }, [smartHandleGameOver]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
  }, []);

  const handleLastSpurt = useCallback(() => {
    // 1. 시간 추가 (+15초)
    // QuizCard의 TimerCircle은 duration={timeLimit} 형태.
    // 따라서 timeLimit를 15로 설정하면 15초 카운트다운 시작.
    useQuizStore.getState().setTimeLimit(15);

    // 2. 피버 발동 (콤보 증가 -> 피버 진입)
    // 기획: +5초 피버? -> 일단 콤보를 늘려서 피버 상태(Lv2)로 만듦
    incrementCombo();
    incrementCombo();
    incrementCombo();
    incrementCombo();
    incrementCombo(); // 대략 5콤보

    // 3. 알림
    setToastValue('🔥 LAST SPURT! +15s 🔥');
    animations.setDamagePosition({ left: '50%', top: '50%' });
    animations.setShowSlideToast(true);
    setTimeout(() => animations.setShowSlideToast(false), 2000);

    // 4. 아이템 소모 (로컬 UI 처리, 실제 소모는 QuizCard에서 호출됨)
    // 여기서는 타이머 리셋 키를 업데이트하여 TimerCircle 강제 리렌더링 (안전장치)
    setTimerResetKey((prev) => prev + 1);
  }, [incrementCombo, animations]);

  const handleSafetyRopeUsed = useCallback(() => {
    setShowSafetyRope(true);
    setTimerResetKey((prev) => prev + 1); // 서바이벌/타임어택 모두 타이머 리셋
    feedbackRef.current?.show('SAFE!', 'Rope Protected!', 'success');
  }, []);

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
    setTotalQuestions: gameStateSettersRef.current.setTotalQuestions,
    setWrongAnswers: gameStateSettersRef.current.setWrongAnswers,
    setSolveTimes: gameStateSettersRef.current.setSolveTimes,
    inputRef,
    showFeedback: (text, subText, type) => feedbackRef.current?.show(text, subText, type),
    setIsFlarePaused,
    onAnswerSubmitted: (_questionId, userAnswer) => {
      gameState.setUserAnswers((prev) => [...prev, userAnswer]);

      if (gameMode === 'infinite' || gameMode === 'survival') {
        const nextSolved = totalInfiniteSolved + 1;
        setTotalInfiniteSolved(nextSolved);
        // 10문제마다 시간 0.5초 감소 (최소 3초)
        if (nextSolved > 0 && nextSolved % 10 === 0) {
          setInfiniteTimeLimit((prev) => Math.max(3, prev - 0.5));
        }
      }
    },
    onPenalty: undefined, // 서바이벌은 v2.2 기획에 따라 즉사(Instant Death) 규칙 적용
  });

  const handleStartGame = async (selectedItemIds: number[]) => {
    if (stamina <= 0) {
      setPendingItemIds(selectedItemIds);
      setShowStaminaModal(true);
      return;
    }

    // [New] Logic Phase 3 "Today's Promise" Check
    if (categoryParam === '논리' && levelParam && levelParam >= 11 && levelParam <= 15) {
      const rule = LOGIC_PROMISES[levelParam] || {
        rule: '논리왕: 모든 규칙 혼합!',
        example: '팩토리얼 + 나머지',
      };
      setPromiseData(rule);
      setPendingItemIds(selectedItemIds);
      setShowTipModal(false);
      setShowPromise(true);
      return;
    }

    const res = await consumeStamina();
    if (!res.success) {
      setPendingItemIds(selectedItemIds);
      setShowStaminaModal(true);
      return;
    }
    setStaminaConsumed(true); // 스테미나 소모 상태 기록 (환불 로직 및 중복 소모 방지용)
    await startWithItems(selectedItemIds);
  };

  const startWithItems = async (selectedItemIds: number[]) => {
    const activeCodes: string[] = [];
    for (const id of selectedItemIds) {
      const item = inventory.find((i) => i.id === id);
      if (item && item.quantity > 0) {
        const res = await consumeItem(id);
        if (res.success) {
          activeCodes.push(item.code);
          analytics.trackEvent({
            category: 'shop',
            action: 'consume_item',
            label: item.code,
            data: { itemId: id },
          });
        }
      }
    }
    setActiveItems(activeCodes);
    if (activeCodes.includes('oxygen_tank')) {
      const current = useQuizStore.getState().timeLimit;
      const valid = [10, 20, 30, 60, 90, 120, 180];
      useQuizStore
        .getState()
        .setTimeLimit((valid.find((l) => l >= current + 10) || 180) as TimeLimit);
    }
    if (activeCodes.includes('power_gel')) incrementCombo();
    setShowTipModal(false);
    setShowStaminaModal(false);

    // [Added] Quiz Start Tracking
    analytics.trackQuizStart(worldParam || 'default', categoryParam || 'default');
  };

  const handlePromiseComplete = async () => {
    setShowPromise(false);
    const res = await consumeStamina();
    if (res.success) {
      setStaminaConsumed(true);
      await startWithItems(pendingItemIds);
    } else {
      setShowStaminaModal(true);
    }
  };

  const handlePlayAnyway = async () => {
    setExhausted(true);
    await startWithItems(pendingItemIds);
  };

  const onAlertAction = useCallback(
    async (action: 'login' | 'charge' | 'play') => {
      switch (action) {
        case 'login':
          navigate('/login', {
            state: { from: window.location.pathname + window.location.search },
          });
          break;
        case 'charge':
          await handleStaminaAdRecovery();
          break;
        case 'play':
          await handlePlayAnyway();
          break;
      }
    },
    [navigate, handleStaminaAdRecovery, handlePlayAnyway]
  );

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

    // 베이스 캠프 초기화
    if (modeParam === 'base-camp') {
      useBaseCampStore.getState().startDiagnostic();
      setShowTipModal(false); // 베이스 캠프는 팁 생략
      setShowTutorial(true); // 튜토리얼 시작
    }

    gameStateRef.current.setTotalQuestions(0);
    gameStateRef.current.setWrongAnswers([]);
    gameStateRef.current.setSolveTimes([]);
    gameStateRef.current.setQuestionStartTime(null);
    setSessionCreated(false);
    isCreatingSessionRef.current = false;
  }, [worldParam, categoryParam, levelParam, modeParam, resetQuiz]);

  const [sessionCreated, setSessionCreated] = useState(false);
  const isCreatingSessionRef = useRef(false);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    if (
      !showTipModal &&
      worldParam &&
      categoryParam &&
      levelParam !== null &&
      modeParam &&
      modeParam !== 'base-camp' &&
      modeParam !== 'base-camp-result' &&
      !sessionCreated &&
      !isCreatingSessionRef.current
    ) {
      isCreatingSessionRef.current = true;
      (async () => {
        try {
          const mode = modeParam.includes('time') ? 'timeattack' : 'survival';
          const { infiniteStamina } = useDebugStore.getState();
          const { data } = await debugSupabaseQuery(
            supabase.rpc('create_game_session', {
              p_questions: [],
              p_category: categoryParam,
              p_subject: worldParam,
              p_level: levelParam,
              p_game_mode: mode,
              p_is_debug_session: infiniteStamina,
            })
          );
          if (data?.session_id) {
            gameState.setGameSessionId(data.session_id);
            setSessionCreated(true);
          }
        } finally {
          isCreatingSessionRef.current = false;
        }
      })();
    }
  }, [showTipModal, worldParam, categoryParam, levelParam, modeParam, sessionCreated, gameState]);

  useEffect(() => {
    if (!showTipModal && !sessionCreated) setTimeout(() => generateNewQuestionRef.current(), 50);
  }, [showTipModal, sessionCreated]);

  useEffect(() => {
    if (modeParam && (modeParam === 'time-attack' || modeParam === 'survival')) {
      setGameMode(modeParam as 'time-attack' | 'survival');
    }
  }, [modeParam, setGameMode]);

  useEffect(() => {
    if (isPreview || isStaminaConsumed) return;
    // 마운트 시에는 스테미나 체크만 수행하고 소모는 하지 않음 (handleStartGame에서 수행)
    (async () => {
      await checkStamina();
      if (useUserStore.getState().stamina <= 0) {
        setShowStaminaModal(true);
        setExhausted(true);
      } else {
        setExhausted(false);
      }
    })();
  }, [isPreview, checkStamina, isStaminaConsumed, setExhausted]);

  const feverLevel = useGameStore((state) => state.feverLevel);

  // Callbacks moved up to avoid conditional hook call error
  const handleKeypadNumber = useCallback(
    (key: string) => {
      if (answerInput.length >= 10) return;

      if (key === '.') {
        if (answerInput.includes('.')) return;
        if (answerInput === '' || answerInput === '-') {
          setAnswerInput(answerInput + '0.');
          setDisplayValue(answerInput + '0.');
          return;
        }
      }

      if (key === '/') {
        if (answerInput.includes('/') || answerInput === '' || answerInput === '-') return;
      }

      if (key === '-') {
        if (answerInput === '') {
          setAnswerInput('-');
          setDisplayValue('-');
        } else if (answerInput === '-') {
          setAnswerInput('');
          setDisplayValue('');
        }
        return;
      }

      const newValue = answerInput + key;
      setAnswerInput(newValue);
      setDisplayValue(newValue);
    },
    [answerInput, setAnswerInput, setDisplayValue]
  );

  const handleQwertyKeyPress = useCallback(
    (k: string) => {
      setAnswerInput((p) => (p + k).slice(0, 20));
      setDisplayValue((p) => (p + k).slice(0, 20));
    },
    [setAnswerInput, setDisplayValue]
  );

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
    <div
      className={`quiz-page fever-level-${feverLevel}`}
      data-world={worldParam || world || 'World1'}
      data-category={categoryParam || ''}
      data-altitude-phase={altitudePhase}
    >
      <QuizCard
        currentQuestion={currentQuestion}
        answerInput={answerInput}
        displayValue={displayValue}
        category={category}
        topic={`${worldParam}-${categoryParam}`}
        categoryParam={categoryParam}
        subParam={worldParam}
        levelParam={levelParam}
        gameMode={gameMode}
        timeLimit={
          gameMode === 'survival' || gameMode === 'infinite' ? infiniteTimeLimit : timeLimit
        }
        questionKey={questionKey}
        timerResetKey={timerResetKey}
        triggerPenalty={0}
        penaltyAmount={5}
        SURVIVAL_QUESTION_TIME={infiniteTimeLimit}
        totalQuestions={gameState.totalQuestions}
        lives={lives}
        onSafetyRopeUsed={handleSafetyRopeUsed}
        onLastSpurt={handleLastSpurt}
        onPause={handlePauseClick}
        remainingPauses={remainingPauses}
        isSubmitting={isSubmitting}
        isError={animations.isError}
        useSystemKeyboard={useSystemKeyboard}
        showTipModal={showTipModal}
        isPaused={isTimerPaused}
        isInputPaused={isInputPaused}
        showExitConfirm={showExitConfirm}
        isFadingOut={isFadingOut}
        cardAnimation={animations.cardAnimation}
        inputAnimation={animations.inputAnimation}
        questionAnimation={animations.questionAnimation}
        showFlash={animations.showFlash}
        showSlideToast={animations.showSlideToast}
        toastValue={toastValue}
        damagePosition={animations.damagePosition}
        generateNewQuestion={generateNewQuestion}
        handleSubmit={handleSubmit}
        handleGameOver={smartHandleGameOver}
        handleKeypadNumber={handleKeypadNumber}
        handleQwertyKeyPress={handleQwertyKeyPress}
        handleKeypadClear={() => {
          setAnswerInput('');
          setDisplayValue('');
        }}
        handleKeypadBackspace={() => {
          setAnswerInput((p) => p.slice(0, -1));
          setDisplayValue((p) => p.slice(0, -1));
        }}
        inputRef={inputRef}
        exitConfirmTimeoutRef={exitConfirmTimeoutRef}
        setAnswerInput={setAnswerInput}
        setDisplayValue={setDisplayValue}
        setShowExitConfirm={setShowExitConfirm}
        setIsFadingOut={setIsFadingOut}
      />
      <QuizModals
        feedbackRef={feedbackRef}
        showLastChanceModal={showLastChanceModal}
        gameMode={gameMode as 'time-attack' | 'survival'}
        inventory={inventory}
        minerals={useUserStore.getState().minerals}
        handleRevive={handleRevive}
        handlePurchaseAndRevive={handlePurchaseAndRevive}
        handleWatchAdAndRevive={handleWatchAdAndRevive}
        handleGiveUp={handleGiveUp}
        showCountdown={showCountdown}
        handleCountdownComplete={handleCountdownComplete}
        showSafetyRope={showSafetyRope}
        setShowSafetyRope={setShowSafetyRope}
        categoryParam={categoryParam}
        subParam={worldParam}
        levelParam={levelParam}
        showTipModal={showTipModal}
        handleBack={handleBack}
        handleStartGame={handleStartGame}
        showPauseModal={showPauseModal}
        remainingPauses={remainingPauses}
        handlePauseClick={handlePauseClick}
        handlePauseResume={handlePauseResume}
        handlePauseExit={handlePauseExit}
        showStaminaModal={showStaminaModal}
        setShowStaminaModal={setShowStaminaModal}
        isAnonymous={isAnonymous}
        onAlertAction={onAlertAction}
      />

      <TodaysPromise
        isVisible={showPromise}
        rule={promiseData.rule}
        example={promiseData.example}
        onComplete={handlePromiseComplete}
      />

      {/* Fever Effect Overlay */}
      <FeverEffect />

      {/* Base Camp Tutorial */}
      <TutorialOverlay
        isVisible={showTutorial}
        steps={tutorialSteps}
        onComplete={() => setShowTutorial(false)}
      />

      {/* v2.2 Landmark Overlay */}
      {activeLandmark && (
        <div className="landmark-popup-overlay">
          <div className="landmark-popup">
            <span className="landmark-icon">{activeLandmark.icon}</span>
            <span className="landmark-text">{activeLandmark.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
