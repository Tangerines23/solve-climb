// src/pages/QuizPage.tsx (범용 퀴즈 페이지)
import { useState, useEffect, useRef, useCallback, useMemo, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './QuizPage.css';
import { useQuizStore, type TimeLimit } from '../stores/useQuizStore';
import { GameTipModal } from '../components/GameTipModal';
import { QuizCard } from '../components/QuizCard';
import { useQuestionGenerator } from '../hooks/useQuestionGenerator';
import { useQuizInput } from '../hooks/useQuizInput';
import { useQuizGameState } from '../hooks/useQuizGameState';
import { useQuizAnimations } from '../hooks/useQuizAnimations';
import { useQuizSubmit } from '../hooks/useQuizSubmit';
import { useSettingsStore } from '../stores/useSettingsStore';
import { storage } from '../utils/storage';
import { CustomKeypad } from '../components/CustomKeypad';
import { QwertyKeypad } from '../components/QwertyKeypad';
import { GameOverlay } from '../components/game/GameOverlay';
import { useUserStore } from '../stores/useUserStore';
import { useGameStore } from '../stores/useGameStore';
import { useDebugStore } from '../stores/useDebugStore';
import type { Category, Topic } from '../types/quiz';
import { StaminaWarningModal } from '../components/game/StaminaWarningModal';
import { ItemFeedbackOverlay, ItemFeedbackRef } from '../components/game/ItemFeedbackOverlay';
import { APP_CONFIG } from '../config/app';
import { supabase } from '../utils/supabaseClient';
import {
  validateCategoryParam,
  validateSubTopicParam,
  validateLevelParam,
  validateModeParam,
  createSafeStorageKey,
} from '../utils/urlParams';
import { QuizQuestion } from '../types/quiz';
import { LastChanceModal } from '../components/LastChanceModal';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { SafetyRopeOverlay } from '../components/game/SafetyRopeOverlay';

export function QuizPage() {
  // Zustand Selector 패턴 적용 - 필요한 값만 구독
  const score = useQuizStore((state) => state.score);
  const difficulty = useQuizStore((state) => state.difficulty);
  const increaseScore = useQuizStore((state) => state.increaseScore);
  const decreaseScore = useQuizStore((state) => state.decreaseScore);
  const resetQuiz = useQuizStore((state) => state.resetQuiz);
  const category = useQuizStore((state) => state.category);
  const topic = useQuizStore((state) => state.topic);
  const timeLimit = useQuizStore((state) => state.timeLimit);
  const setGameMode = useQuizStore((state) => state.setGameMode);
  const gameMode = useQuizStore((state) => state.gameMode);
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [useSystemKeyboard, setUseSystemKeyboard] = useState(false);
  const [showTipModal, setShowTipModal] = useState(true);
  const [showStaminaModal, setShowStaminaModal] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState<number[]>([]);
  const [_gameQuestions, setGameQuestions] = useState<
    Array<{ id: string; question: QuizQuestion; userAnswer: number | null }>
  >([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  // 사용자 스토어
  const {
    stamina,
    inventory,
    checkStamina,
    consumeItem,
    consumeStamina,
    minerals,
    recoverStaminaAds,
  } = useUserStore();

  // 애니메이션 상태 관리 (handleWatchAd보다 먼저 선언)
  const animations = useQuizAnimations();

  // ... (중략)

  // 광고 보기 핸들러
  const handleWatchAd = useCallback(async () => {
    // 1. 모달 닫기
    // 2. Mock Ad Process (광고 시청 로직)
    const adDuration = 3000; // 3초
    animations.setShowSlideToast(true);

    // [AD] 실제 광고 연동 시 여기서 showAd() 호출 (Google AdMob 등)
    // 현재는 사용자 경험 테스트를 위해 3초 딜레이로 대체함.

    await new Promise((resolve) => setTimeout(resolve, adDuration));

    // 3. 보상 지급
    const result = await recoverStaminaAds();
    if (result.success) {
      setShowStaminaModal(false);
      window.location.reload();
    } else {
      alert('광고 보상 지급 실패: ' + result.message);
    }
  }, [animations, recoverStaminaAds]);

  // Revive System State
  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [hasUsedLastChance, setHasUsedLastChance] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isFlarePaused, setIsFlarePaused] = useState(false); // 구조 신호탄 사용 후 타이머 일시정지
  const [showSafetyRope, setShowSafetyRope] = useState(false);

  const {
    setExhausted,
    resetGame,
    setActiveItems,
    incrementCombo,
    setCombo,
    isStaminaConsumed,
    setStaminaConsumed,
  } = useGameStore();
  const isAdminMode = useDebugStore((state) => state.isAdminMode);
  const [questionKey, setQuestionKey] = useState(0);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [previewKeyboardType, setPreviewKeyboardType] = useState<'custom' | 'qwerty'>(
    () => keyboardType
  );

  const SURVIVAL_QUESTION_TIME = 5;
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<ItemFeedbackRef>(null);

  // URL 파라미터에서 레벨 정보 읽기 및 검증
  const categoryParamRaw = searchParams.get('category');
  const subParamRaw = searchParams.get('sub');
  const levelParamRaw = searchParams.get('level');
  const modeParamRaw = searchParams.get('mode');

  const categoryParam = validateCategoryParam(categoryParamRaw);
  const subParam = validateSubTopicParam(categoryParam, subParamRaw);
  const levelParam = validateLevelParam(levelParamRaw, 20);
  const modeParam = validateModeParam(modeParamRaw);
  const isPreview = searchParams.get('preview') === 'true';

  // 게임 상태 관리
  const gameState = useQuizGameState({
    score,
    gameMode,
    categoryParam,
    subParam,
    levelParam,
    modeParam,
    isExhausted: useGameStore.getState().isExhausted,
    navigate,
  });

  // 문제 생성 로직
  const { generateNewQuestion } = useQuestionGenerator({
    category,
    topic,
    difficulty,
    gameMode,
    categoryParam,
    subParam,
    levelParam,
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
      // 문제 생성 시 문제 ID와 문제 정보 수집
      setGameQuestions((prev) => [...prev, { id: questionId, question, userAnswer: null }]);
      gameState.setQuestionIds((prev) => [...prev, questionId]);
      setCurrentQuestionId(questionId);
    },
  });

  // 구조 신호탄 타이머 재개 핸들러
  const handleFlareInputStart = useCallback(() => {
    if (isFlarePaused) {
      setIsFlarePaused(false);
    }
  }, [isFlarePaused]);

  // 키보드 입력 처리
  const inputHandlers = useQuizInput({
    answerInput,
    isSubmitting,
    isError: animations.isError,
    isPaused: showTipModal || showLastChanceModal || showCountdown || isFlarePaused,
    categoryParam,
    subParam,
    setAnswerInput,
    setDisplayValue,
    onInputStart: handleFlareInputStart,
  });

  // gameState의 setter들을 안정적으로 참조하기 위한 ref
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

  // handleGameOver를 안정적인 참조로 유지 (QuizCard에 전달하기 위해)
  const handleGameOverRef = useRef(gameState.handleGameOver);
  useEffect(() => {
    handleGameOverRef.current = gameState.handleGameOver;
  }, [gameState.handleGameOver]);

  // generateNewQuestion의 최신 참조를 유지하기 위한 ref
  const generateNewQuestionRef = useRef(generateNewQuestion);
  useEffect(() => {
    generateNewQuestionRef.current = generateNewQuestion;
  }, [generateNewQuestion]);

  // 안정적인 handleGameOver 함수 (QuizCard에 전달) - LAST CHANCE INTERCEPT
  const stableHandleGameOver = useCallback(() => {
    // 이미 부활을 사용했거나, 미리보기 모드라면 즉시 종료
    if (hasUsedLastChance || isPreview) {
      handleGameOverRef.current();
      return;
    }

    // 아이템 보유 확인
    // const hasItem = inventory.find((i: any) => i.code === itemType && i.quantity > 0);
    // 아이템이 없어도, 미네랄이 있어도, 일단 모달은 띄워서 '기회'를 보여준다.
    setShowLastChanceModal(true);
  }, [hasUsedLastChance, isPreview]);

  // Revive Logic
  const handleRevive = useCallback(
    async (useItem: boolean) => {
      const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';

      if (useItem) {
        const item = inventory.find((i) => i.code === itemType);
        if (item) {
          await consumeItem(item.id);
        }
      }

      setShowLastChanceModal(false);
      setHasUsedLastChance(true);
      setIsSubmitting(false);

      if (gameMode === 'time-attack') {
        // 타임어택: 라스트 스퍼트 사용 시 +15초 추가
        // 1. 시간을 15초로 설정
        useQuizStore.getState().setTimeLimit(15);
        // 2. 타이머 리셋 (key 변경으로 TimerCircle 리마운트)
        setTimerResetKey((prev) => prev + 1);
        // 3. 카운트다운 시작 (3-2-1)
        setShowCountdown(true);
        // 피버 상태는 카운트다운 완료 후 처리
      } else {
        // 서바이벌: 새 문제로 진행
        generateNewQuestionRef.current();
        animations.setIsError(false);
        setDisplayValue('');
      }
    },
    [gameMode, inventory, consumeItem, animations]
  );

  const handleCountdownComplete = useCallback(() => {
    // 카운트다운 완료 후 처리 순서:
    // 1. 피버 상태 활성화 (Second Wind)
    setCombo(20);

    // 2. 카운트다운 닫기 (isPaused 해제로 타이머 시작)
    // handleRevive에서 이미 타이머를 리셋했으므로 여기서는 닫기만 처리
    setShowCountdown(false);
  }, [setCombo]);

  const handleSafetyRopeUsed = useCallback(() => {
    setShowSafetyRope(true);
    // 안전 로프는 오답 방어이므로 시간을 변경하지 않음
    // 오답 방어 시: 입력만 초기화하고 문제는 그대로 유지
    // Time Up 방어 시: 타이머 리셋 필요 (타임어택의 경우 원래 제한시간으로)
    if (gameMode === 'time-attack') {
      // Time Up 방어 시 타이머 리셋 (원래 제한시간으로)
      setTimerResetKey((prev) => prev + 1);
    }
  }, [gameMode]);

  const handlePurchaseAndRevive = useCallback(async () => {
    const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
    // 라스트 스퍼트 800원, 구조 신호탄 800원
    const basePrice = itemType === 'last_spurt' ? 800 : 800;
    const targetPrice = basePrice * 2;

    if (minerals >= targetPrice) {
      console.log(`Simulating purchase of ${itemType} for ${targetPrice} minerals`);
      // TODO: 실제 구매 로직 연동 필요 (purchaseItem 사용 시 ID 필요)
      // 임시: 구매 성공 가정하고 진행
      await handleRevive(false);
    }
  }, [minerals, gameMode, handleRevive]);

  const handleGiveUp = useCallback(() => {
    setShowLastChanceModal(false);
    handleGameOverRef.current(); // 진짜 종료
  }, []);

  // 답안 제출 로직
  const { handleSubmit } = useQuizSubmit({
    answerInput,
    isSubmitting,
    currentQuestion,
    categoryParam,
    subParam,
    gameMode,
    questionStartTime: gameState.questionStartTime,
    hapticEnabled,
    useSystemKeyboard,
    setIsSubmitting,
    setCardAnimation: animations.setCardAnimation,
    onSafetyRopeUsed: handleSafetyRopeUsed, // Pass handler
    setInputAnimation: animations.setInputAnimation,
    setDisplayValue,
    setIsError: animations.setIsError,
    setShowFlash: animations.setShowFlash,
    setShowSlideToast: animations.setShowSlideToast,
    setDamagePosition: animations.setDamagePosition,
    setAnswerInput,
    increaseScore,
    decreaseScore,
    generateNewQuestion,
    handleGameOver: stableHandleGameOver, // Intercepted handler
    setTotalQuestions: gameStateSettersRef.current.setTotalQuestions,
    setWrongAnswers: gameStateSettersRef.current.setWrongAnswers,
    setSolveTimes: gameStateSettersRef.current.setSolveTimes,
    inputRef,
    showFeedback: (text: string, subText?: string, type?: 'success' | 'info') =>
      feedbackRef.current?.show(text, subText, type),
    setIsFlarePaused,
    onAnswerSubmitted: (questionId, userAnswer) => {
      // 답안 수집
      setGameQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, userAnswer } : q)));
      gameState.setUserAnswers((prev) => [...prev, userAnswer]);
    },
    currentQuestionId,
  });

  // categoryParam이나 subParam, levelParam이 변경될 때 팁 모달 상태 업데이트
  useEffect(() => {
    if (categoryParam && subParam) {
      const tipKey = levelParam
        ? createSafeStorageKey('gameTip', categoryParam, subParam, levelParam)
        : createSafeStorageKey('gameTip', categoryParam, subParam);
      const shouldHide = storage.getString(tipKey) === 'true';
      setShowTipModal(!shouldHide);
    }
  }, [categoryParam, subParam, levelParam]);

  // 게임 모드 설정
  useEffect(() => {
    if (modeParam) {
      const mode =
        String(modeParam) === 'time_attack' || modeParam === 'time-attack'
          ? ('time-attack' as const)
          : ('survival' as const);
      setGameMode(mode);
    }
  }, [modeParam, setGameMode]);

  const handleStartGame = async (selectedItemIds: number[]) => {
    // 1. Check Stamina
    if (stamina <= 0) {
      setPendingItemIds(selectedItemIds);
      setShowStaminaModal(true);
      return;
    }

    // 2. Consume Stamina
    const staminaResult = await consumeStamina();
    if (!staminaResult.success) {
      // Small chance of race condition, but handle it
      setPendingItemIds(selectedItemIds);
      setShowStaminaModal(true);
      return;
    }

    // 3. Normal Start
    await startWithItems(selectedItemIds);
  };

  const startWithItems = async (selectedItemIds: number[]) => {
    // 1. Consume items and identify their codes
    const activeCodes: string[] = [];
    for (const id of selectedItemIds) {
      const item = inventory.find((i) => i.id === id);
      if (item && item.quantity > 0) {
        const result = await consumeItem(id);
        if (result.success) {
          activeCodes.push(item.code);
        }
      }
    }

    // 2. Set active items in store
    setActiveItems(activeCodes);

    // 3. Apply immediate effects
    if (activeCodes.includes('oxygen_tank')) {
      const currentTimeLimit = useQuizStore.getState().timeLimit;
      const newLimit = Math.min(currentTimeLimit + 10, 180);
      // TimeLimit 타입: 10 | 20 | 30 | 60 | 90 | 120 | 180
      const validLimits = [10, 20, 30, 60, 90, 120, 180];
      const closestLimit = validLimits.find((l) => l >= newLimit) || 180;
      useQuizStore.getState().setTimeLimit(closestLimit as TimeLimit);
    }

    if (activeCodes.includes('power_gel')) {
      incrementCombo(); // Start with 1 combo (Momentum)
    }

    // 4. Close modal and start quiz
    setShowTipModal(false);
    setShowStaminaModal(false);
    // generateNewQuestion(); // useEffect에서 호출됨
  };

  const handlePlayAnyway = async () => {
    setExhausted(true);
    await startWithItems(pendingItemIds);
  };

  // URL 파라미터에서 category와 topic 설정
  useEffect(() => {
    if (categoryParam && subParam) {
      const categoryName =
        APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
      if (categoryName) {
        setCategoryTopic(categoryName as Category, subParam as Topic);
      }
    }
  }, [categoryParam, subParam, setCategoryTopic]);

  // 카테고리나 분야가 선택되지 않았으면 홈으로 리다이렉트
  useEffect(() => {
    if (!category || !topic) {
      if (!categoryParam || !subParam) {
        navigate('/');
      }
    }
  }, [category, topic, navigate, categoryParam, subParam]);

  // gameState의 setter 함수들을 ref로 안정적인 참조 유지
  // gameState 객체 전체가 아닌 개별 속성들을 추적
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [
    gameState.totalQuestions,
    gameState.wrongAnswers,
    gameState.questionStartTime,
    gameState.solveTimes,
    gameState.handleGameOver,
    gameState.setTotalQuestions,
    gameState.setWrongAnswers,
    gameState.setQuestionStartTime,
    gameState.setSolveTimes,
    gameState,
  ]);

  // 초기화 로직: categoryParam, subParam, levelParam이 변경될 때만 실행
  useEffect(() => {
    resetQuiz();
    resetGame();
    checkStamina().then(() => {
      if (stamina <= 0) {
        setExhausted(true);
      }
    });
    gameStateRef.current.setTotalQuestions(0);
    gameStateRef.current.setWrongAnswers([]);
    gameStateRef.current.setSolveTimes([]);
    gameStateRef.current.setQuestionStartTime(null);
    setSessionCreated(false); // 세션 생성 상태 초기화
    isCreatingSessionRef.current = false; // 세션 생성 플래그 초기화
    setGameQuestions([]); // 게임 문제 초기화
    setCurrentQuestionId(null); // 현재 문제 ID 초기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, subParam, levelParam, resetQuiz]);

  // 게임 시작 시 세션 생성 (한 번만 실행)
  const [sessionCreated, setSessionCreated] = useState(false);
  const setGameSessionId = gameState.setGameSessionId;
  const isCreatingSessionRef = useRef(false);
  useEffect(() => {
    if (
      !showTipModal &&
      categoryParam &&
      subParam &&
      levelParam !== null &&
      modeParam &&
      !sessionCreated &&
      !isCreatingSessionRef.current
    ) {
      isCreatingSessionRef.current = true;
      const createGameSession = async () => {
        try {
          // RPC는 'timeattack' (하이픈/언더바 없음)을 기대함
          const rpcGameMode =
            modeParam === 'time-attack' || (modeParam as string) === 'time_attack'
              ? 'timeattack'
              : 'survival';

          // 디버그 모드 상태 확인
          const { infiniteStamina } = useDebugStore.getState();

          // 빈 세션 생성 (문제는 나중에 추가)
          // 실제로는 문제를 미리 생성하거나, 문제가 생성될 때마다 세션을 업데이트해야 하지만
          // 현재 구조에서는 게임 종료 시 문제와 답안을 한 번에 제출하는 방식 사용
          const { data, error } = await supabase.rpc('create_game_session', {
            p_questions: [], // 빈 배열 (JSONB는 자동으로 변환됨)
            p_category: categoryParam,
            p_subject: subParam,
            p_level: levelParam,
            p_game_mode: rpcGameMode,
            p_is_debug_session: infiniteStamina, // 무한 스태미나 모드일 때 true
          });

          if (error) {
            console.error('[QuizPage] 게임 세션 생성 실패:', error);
            isCreatingSessionRef.current = false;
            // 세션 생성 실패해도 게임은 계속 진행
          } else if (data?.session_id) {
            setGameSessionId(data.session_id);
            console.log('[QuizPage] 게임 세션 생성 성공:', data.session_id);
            setSessionCreated(true);
            isCreatingSessionRef.current = false;
          }
        } catch (error) {
          console.error('[QuizPage] 게임 세션 생성 중 오류:', error);
          isCreatingSessionRef.current = false;
        }
      };

      createGameSession();
    }

    // cleanup: 컴포넌트 언마운트 시 플래그 초기화
    return () => {
      isCreatingSessionRef.current = false;
    };
  }, [
    showTipModal,
    categoryParam,
    subParam,
    levelParam,
    modeParam,
    sessionCreated,
    setGameSessionId,
  ]);

  // showTipModal이 false가 되면 문제 생성
  useEffect(() => {
    if (!showTipModal && !sessionCreated) {
      // 약간의 지연을 두어 상태 업데이트가 완료된 후 실행
      const timer = setTimeout(() => {
        generateNewQuestionRef.current();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showTipModal, sessionCreated]);

  const handleBack = useCallback(() => {
    if (showExitConfirm) {
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
        exitConfirmTimeoutRef.current = null;
      }
      setIsFadingOut(false);
      setShowExitConfirm(false);
      if (categoryParam && subParam) {
        navigate(`/level-select?category=${categoryParam}&sub=${subParam}`);
      } else {
        navigate('/');
      }
    } else {
      setIsFadingOut(false);
      setShowExitConfirm(true);
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
      }
      exitConfirmTimeoutRef.current = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShowExitConfirm(false);
          setIsFadingOut(false);
          exitConfirmTimeoutRef.current = null;
        }, 300);
      }, 3000);
    }
  }, [showExitConfirm, categoryParam, subParam, navigate]);

  // 화면 높이 감지 및 키보드 모드 전환
  useEffect(() => {
    const checkViewportHeight = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;

      let isLandscape = false;

      if (screen.orientation) {
        const orientationType = screen.orientation.type;
        isLandscape = orientationType.includes('landscape');
      } else if (window.matchMedia) {
        isLandscape = window.matchMedia('(orientation: landscape)').matches;
      } else {
        isLandscape = width > height;
      }

      const isSmallScreen = height < 600;
      const shouldUseSystemKeyboard = isSmallScreen && !isLandscape;

      setUseSystemKeyboard(shouldUseSystemKeyboard);
    };

    checkViewportHeight();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkViewportHeight, 100);
    };

    window.addEventListener('resize', handleResize);

    const handleOrientationChange = () => {
      setTimeout(checkViewportHeight, 200);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    let mediaQuery = null;
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(orientation: landscape)');
      mediaQuery.addEventListener('change', handleOrientationChange);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkViewportHeight);
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleOrientationChange);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkViewportHeight);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
        exitConfirmTimeoutRef.current = null;
      }
    };
  }, []);

  // 화면 어디든 클릭하면 토스트 닫기
  useEffect(() => {
    if (!showExitConfirm) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.exit-confirm-toast')) {
        if (exitConfirmTimeoutRef.current) {
          clearTimeout(exitConfirmTimeoutRef.current);
          exitConfirmTimeoutRef.current = null;
        }
        setIsFadingOut(true);
        setTimeout(() => {
          setShowExitConfirm(false);
          setIsFadingOut(false);
        }, 300);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExitConfirm]);

  // 게임 시작 시 스태미나 소모 및 고갈 상태 체크
  // [Fix] useRef 대신 전역 Store 상태(isStaminaConsumed)를 사용하여
  // React StrictMode의 Remount 상황에서도 중복 실행을 완벽히 방지합니다.
  useEffect(() => {
    // 미리보기 모드이거나, 이미 이번 세션에서 스태미나를 소모했다면 패스
    if (isPreview || isStaminaConsumed) return;

    // [중요] 비동기 로직 시작 전에 즉시 Lock을 건다.
    // Store 업데이트는 컴포넌트가 Remount 되어도 유지되므로 안전함.
    setStaminaConsumed(true);

    const initStamina = async () => {
      // 1. 현재 스태미나 확인 (DB 최신화)
      await checkStamina();
      const currentStamina = useUserStore.getState().stamina;

      if (currentStamina <= 0) {
        // 스태미나 고갈 상태: 경고 모달 표시 & 게임 전역 상태에 패널티 설정
        setShowStaminaModal(true);
        setExhausted(true);
      } else {
        // 스태미나 소모
        setExhausted(false);
        await consumeStamina();
      }
    };

    initStamina();
  }, [
    isPreview,
    checkStamina,
    consumeStamina,
    isStaminaConsumed,
    setExhausted,
    setStaminaConsumed,
  ]);

  // Preview 모드용 간단한 핸들러들
  const handlePreviewKeyPress = useCallback((key: string) => {
    // Preview 모드에서는 입력을 콘솔에만 출력
    console.log('Preview key press:', key);
  }, []);

  const handlePreviewClear = useCallback(() => {
    console.log('Preview clear');
  }, []);

  const handlePreviewBackspace = useCallback(() => {
    console.log('Preview backspace');
  }, []);

  const handlePreviewSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    console.log('Preview submit');
  }, []);

  // Preview 모드용 변수들 (조건부 블록 밖에서 계산)
  const isJapaneseQuizPreview = categoryParam === 'language' && subParam === 'japanese';
  const isEquationQuizPreview = categoryParam === 'math' && subParam === 'equations';
  const isCalculusQuizPreview = categoryParam === 'math' && subParam === 'calculus';
  const allowNegativePreview = isEquationQuizPreview || isCalculusQuizPreview;

  // displayCategory와 displayTopic 계산 (Preview 모드용)
  const displayCategoryPreview = useMemo(() => {
    if (!isPreview) return '';
    return categoryParam
      ? APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
          category ||
          ''
      : category || '';
  }, [isPreview, categoryParam, category]);

  const displayTopicPreview = useMemo(() => {
    if (!isPreview || !categoryParam || !subParam) return topic || '';

    if (subParam === 'arithmetic' && levelParam !== null) {
      const level = levelParam;
      const topicMap: Record<number, string> = {
        1: '덧셈',
        2: '뺄셈',
        3: '덧셈',
        4: '뺄셈',
        5: '곱셈',
        6: '나눗셈',
        7: '혼합 연산',
        8: '곱셈',
        9: '나눗셈',
        10: '종합 연산',
      };
      return topicMap[level] || '덧셈';
    } else if (subParam === 'calculus' && levelParam !== null) {
      const level = levelParam;
      const topicMap: Record<number, string> = {
        1: '기초 미분',
        2: '상수배 미분',
        3: '합과 차의 미분',
        4: '곱의 미분',
        5: '몫의 미분',
        6: '합성함수 미분',
        7: '삼각함수 미분',
        8: '지수·로그 미분',
        9: '고급 미분',
        10: '미분 종합',
      };
      return topicMap[level] || '미적분';
    } else {
      const subTopics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
      const subTopicInfo = subTopics?.find((t) => t.id === subParam);
      return subTopicInfo?.name || subParam;
    }
  }, [isPreview, categoryParam, subParam, levelParam, topic]);

  // Preview 모드에서 keyboardType 변경 시 previewKeyboardType 동기화
  useEffect(() => {
    if (isPreview) {
      setPreviewKeyboardType(keyboardType);
    }
  }, [isPreview, keyboardType]);

  // Preview 모드에서 키보드 타입 전환 핸들러 (early return 전에 호출)
  const handlePrevKeyboard = useCallback(() => {
    setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
  }, []);

  const handleNextKeyboard = useCallback(() => {
    setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
  }, []);

  // Preview 모드일 때 렌더링
  if (isPreview) {
    // 일본어 퀴즈가 아닐 때만 키보드 타입 전환 가능
    const canSwitchKeyboard = !isJapaneseQuizPreview;
    const currentPreviewType = isJapaneseQuizPreview ? 'qwerty' : previewKeyboardType;

    return (
      <div className="quiz-page">
        <header className="quiz-header">
          <button
            className="quiz-back-button"
            onClick={() => navigate('/my-page')}
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <div
            className="quiz-timer-container"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}
          >
            {canSwitchKeyboard && (
              <button
                onClick={handlePrevKeyboard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 'var(--spacing-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  minHeight: '32px',
                  borderRadius: 'var(--rounded-sm)',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="이전 키보드"
              >
                ‹
              </button>
            )}
            <h2
              style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}
            >
              {currentPreviewType === 'custom' ? '커스텀 키패드' : '쿼티 키보드'}
            </h2>
            {canSwitchKeyboard && (
              <button
                onClick={handleNextKeyboard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 'var(--spacing-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  minHeight: '32px',
                  borderRadius: 'var(--rounded-sm)',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="다음 키보드"
              >
                ›
              </button>
            )}
          </div>
          <div className="quiz-header-spacer"></div>
        </header>

        <div className="quiz-content">
          {/* quiz-card - 인게임과 동일한 구조 */}
          <div className="quiz-card">
            <div className="category-label">
              {displayCategoryPreview} - {displayTopicPreview}
            </div>
            <form onSubmit={handlePreviewSubmit} style={{ display: 'contents' }}>
              <div>
                <h2 className="problem-text">미리보기</h2>
              </div>
              {/* 답안 표시 영역 (빈 상태) */}
              {!useSystemKeyboard && (
                <div className="answer-input-wrapper">
                  <div className="answer-display">
                    {/* 빈 상태 - 커서만 표시 */}
                    <span className="answer-caret"></span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* 하단 키보드 (카드 아래) - Preview 모드에서는 선택한 키보드 타입 사용 */}
          {!useSystemKeyboard && (
            <>
              {isJapaneseQuizPreview ? (
                <QwertyKeypad
                  onKeyPress={handlePreviewKeyPress}
                  onClear={handlePreviewClear}
                  onBackspace={handlePreviewBackspace}
                  onSubmit={handlePreviewSubmit}
                  disabled={false}
                  mode="text"
                />
              ) : currentPreviewType === 'qwerty' ? (
                <QwertyKeypad
                  onKeyPress={handlePreviewKeyPress}
                  onClear={handlePreviewClear}
                  onBackspace={handlePreviewBackspace}
                  onSubmit={handlePreviewSubmit}
                  disabled={false}
                  mode="number"
                  allowNegative={allowNegativePreview}
                />
              ) : (
                <CustomKeypad
                  onNumberClick={handlePreviewKeyPress}
                  onClear={handlePreviewClear}
                  onBackspace={handlePreviewBackspace}
                  onSubmit={handlePreviewSubmit}
                  disabled={false}
                  showNegative={allowNegativePreview}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* 아이템 피드백 (사용 효과 등) */}
      <ItemFeedbackOverlay ref={feedbackRef} />

      {/* 부활/라스트 찬스 모달 */}
      <LastChanceModal
        isVisible={showLastChanceModal}
        gameMode={gameMode}
        inventoryCount={
          inventory.find((i) => i.code === (gameMode === 'time-attack' ? 'last_spurt' : 'flare'))
            ?.quantity || 0
        }
        userMinerals={minerals}
        onUseItem={() => handleRevive(true)}
        onPurchaseAndUse={handlePurchaseAndRevive}
        onGiveUp={handleGiveUp}
        basePrice={gameMode === 'time-attack' ? 800 : 800}
      />

      {/* 카운트다운 오버레이 (부활 후 재개 시 사용) */}
      {showCountdown && (
        <CountdownOverlay isVisible={showCountdown} onComplete={handleCountdownComplete} />
      )}

      {/* 안전 로프 사용 효과 오버레이 */}
      {showSafetyRope && (
        <SafetyRopeOverlay isVisible={true} onAnimationComplete={() => setShowSafetyRope(false)} />
      )}

      {categoryParam && subParam && (
        <GameTipModal
          isOpen={showTipModal}
          category={categoryParam}
          subTopic={subParam}
          level={levelParam}
          onClose={handleBack}
          onStart={handleStartGame}
        />
      )}
      <GameOverlay />
      <StaminaWarningModal
        isOpen={showStaminaModal}
        onClose={() => setShowStaminaModal(false)}
        onPlayAnyway={handlePlayAnyway}
        onWatchAd={handleWatchAd}
      />
      <ItemFeedbackOverlay ref={feedbackRef} />
      <QuizCard
        currentQuestion={currentQuestion}
        answerInput={answerInput}
        displayValue={displayValue}
        category={category}
        topic={topic}
        categoryParam={categoryParam}
        subParam={subParam}
        levelParam={levelParam}
        gameMode={gameMode}
        timeLimit={timeLimit}
        questionKey={questionKey}
        timerResetKey={timerResetKey}
        SURVIVAL_QUESTION_TIME={SURVIVAL_QUESTION_TIME}
        isSubmitting={isSubmitting}
        isError={animations.isError}
        useSystemKeyboard={useSystemKeyboard}
        showTipModal={showTipModal}
        isPaused={showTipModal || showLastChanceModal || showCountdown || isFlarePaused}
        showExitConfirm={showExitConfirm}
        isFadingOut={isFadingOut}
        showAnswer={isAdminMode}
        cardAnimation={animations.cardAnimation}
        inputAnimation={animations.inputAnimation}
        questionAnimation={animations.questionAnimation}
        showFlash={animations.showFlash}
        showSlideToast={animations.showSlideToast}
        damagePosition={animations.damagePosition}
        handleSubmit={handleSubmit}
        handleBack={handleBack}
        handleGameOver={stableHandleGameOver}
        handleKeypadNumber={inputHandlers.handleKeypadNumber}
        handleQwertyKeyPress={inputHandlers.handleQwertyKeyPress}
        handleKeypadClear={inputHandlers.handleKeypadClear}
        handleKeypadBackspace={inputHandlers.handleKeypadBackspace}
        inputRef={inputRef}
        exitConfirmTimeoutRef={exitConfirmTimeoutRef}
        setAnswerInput={setAnswerInput}
        setDisplayValue={setDisplayValue}
        setIsError={animations.setIsError}
        setShowFlash={animations.setShowFlash}
        setShowExitConfirm={setShowExitConfirm}
        setIsFadingOut={setIsFadingOut}
      />
    </div>
  );
}
