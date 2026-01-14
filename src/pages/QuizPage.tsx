// src/pages/QuizPage.tsx (범용 퀴즈 페이지)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './QuizPage.css';
import { useQuizStore, type TimeLimit } from '../stores/useQuizStore';
// import { GameTipModal } from '../components/GameTipModal';
import { QuizCard } from '../components/QuizCard';
import { useQuestionGenerator } from '../hooks/useQuestionGenerator';
import { useQuizInput } from '../hooks/useQuizInput';
import { useQuizGameState } from '../hooks/useQuizGameState';
import { useQuizAnimations } from '../hooks/useQuizAnimations';
import { useQuizSubmit } from '../hooks/useQuizSubmit';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useQuizRevive } from '../hooks/useQuizRevive';
import { useUserStore } from '../stores/useUserStore';
import { useGameStore } from '../stores/useGameStore';
import { useDebugStore } from '../stores/useDebugStore';
import type { Category, Topic } from '../types/quiz';
import { ItemFeedbackOverlay, ItemFeedbackRef } from '../components/game/ItemFeedbackOverlay';
import { APP_CONFIG } from '../config/app';
import { supabase } from '../utils/supabaseClient';
import {
  validateCategoryParam,
  validateSubTopicParam,
  validateLevelParam,
  validateModeParam,
} from '../utils/urlParams';
import { QuizQuestion } from '../types/quiz';
import { QuizPreview } from '../components/quiz/QuizPreview';
import { QuizModals } from '../components/quiz/QuizModals';
import { ConfirmModal } from '../components/ConfirmModal';

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
  const lives = useGameStore((state) => state.lives);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [toastValue, setToastValue] = useState('');
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
    refundStamina,
  } = useUserStore();

  // 애니메이션 상태 관리 (handleWatchAd보다 먼저 선언)
  const animations = useQuizAnimations();

  // ... (중략)

  // 스태미나 광고 회복 핸들러 (Mock 전용)
  const handleStaminaAdRecovery = useCallback(async () => {
    // 1. 시뮬레이션: 광고 시청 중...
    const adDuration = 2500; // 2.5초
    animations.setShowSlideToast(true);
    setToastValue('광고 시청 중... (Mock)');

    // [AD] 실제 광고 연동 시 Google AdMob 또는 토스 광고 SDK 호출
    await new Promise((resolve) => setTimeout(resolve, adDuration));

    // 2. 보상 지급 (사용자 스토어 연동)
    const result = await recoverStaminaAds();
    if (result.success) {
      setShowStaminaModal(false);
      setToastValue('산소통(스태미나)이 충전되었습니다! 🫧');
      // 리로드 대신 상태 초기화로 처리 권장되나 현재 호환성을 위해 유지 가능
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setToastValue('충전 실패: ' + result.message);
    }
  }, [animations, recoverStaminaAds]);

  // Revive System State
  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isFlarePaused, setIsFlarePaused] = useState(false); // 구조 신호탄 사용 후 타이머 일시정지
  const [showSafetyRope, setShowSafetyRope] = useState(false);

  // Pause System State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showPauseExitConfirm, setShowPauseExitConfirm] = useState(false);
  const [remainingPauses, setRemainingPauses] = useState(3);

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
  const [previewKeyboardType] = useState<'custom' | 'qwerty'>(() => keyboardType);

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
      // 문제 생성 시 문제 ID와 문제 정보 수집
      setGameQuestions((prev) => [...prev, { id: questionId, question, userAnswer: null }]);
      gameState.setQuestionIds((prev) => [...prev, questionId]);
      setCurrentQuestionId(questionId);
    },
  });

  // generateNewQuestion의 최신 참조를 유지하기 위한 ref (for Pause Logic)
  const generateNewQuestionRef = useRef(generateNewQuestion);
  useEffect(() => {
    generateNewQuestionRef.current = generateNewQuestion;
  }, [generateNewQuestion]);

  // 구조 신호탄 타이머 재개 핸들러
  const handleFlareInputStart = useCallback(() => {
    if (isFlarePaused) {
      setIsFlarePaused(false);
    }
  }, [isFlarePaused]);

  // handleBack (Moved up for Pause Logic)
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
      setToastValue('뒤로 가려면 한 번 더 누르세요');
      setShowExitConfirm(true);
      setIsFadingOut(false);

      // 애니메이션을 위해 잠시 대기
      setTimeout(() => setIsFadingOut(true), 2500);

      exitConfirmTimeoutRef.current = setTimeout(() => {
        setShowExitConfirm(false);
        setIsFadingOut(false);
        exitConfirmTimeoutRef.current = null;
      }, 3000); // 3초 후 토스트 닫기
    }
  }, [showExitConfirm, categoryParam, subParam, navigate]);

  // Pause System Handlers
  const handlePauseClick = useCallback(() => {
    if (remainingPauses > 0) {
      setShowPauseModal(true);
    } else {
      feedbackRef.current?.show('일시정지 횟수 초과!', '더 이상 일시정지할 수 없습니다.', 'info');
    }
  }, [remainingPauses]);

  const handlePauseResume = useCallback(() => {
    if (remainingPauses > 0) {
      setRemainingPauses((prev) => prev - 1);
      // Reroll Question Logic
      generateNewQuestionRef.current(); // New question
      // State updates
      setShowPauseModal(false);
      feedbackRef.current?.show('문제 교체!', '일시정지 페널티로 문제가 변경되었습니다.', 'info');
    }
  }, [remainingPauses]);

  const handlePauseExit = useCallback(() => {
    setShowPauseExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowPauseExitConfirm(false);
    setShowPauseModal(false);
    if (categoryParam && subParam) {
      navigate(`/level-select?category=${categoryParam}&sub=${subParam}`);
    } else {
      navigate('/');
    }
  }, [navigate, categoryParam, subParam]);

  // Pause Logic Separation
  const isTimerPaused =
    showTipModal || showLastChanceModal || showCountdown || isFlarePaused || showPauseModal;
  const isInputPaused = showTipModal || showLastChanceModal || showCountdown || showPauseModal; // Input is NOT paused by Flare

  // 키보드 입력 처리
  const inputHandlers = useQuizInput({
    answerInput,
    isSubmitting,
    isError: animations.isError,
    isPaused: isInputPaused, // Use Input Pause specifically
    categoryParam,
    subParam,
    setAnswerInput,
    setDisplayValue,
    onInputStart: handleFlareInputStart,
  });

  // ... (refs)

  // ... (handlers)

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

  // Revive Hook Integration
  const revive = useQuizRevive({
    gameMode,
    inventory,
    minerals,
    consumeItem,
    setShowLastChanceModal,
    setTimerResetKey,
    setShowCountdown,
    generateNewQuestion: generateNewQuestionRef.current,
    animations,
    setDisplayValue,
    handleGameOver: handleGameOverRef.current,
    setIsSubmitting,
    isPreview,
  });

  const { handleRevive, handlePurchaseAndRevive, handleGiveUp, stableHandleGameOver } = revive;

  const smartHandleGameOver = useCallback(
    (reason?: string) => {
      // 1. 환불 로직 체크
      if (
        gameState.totalQuestions === 0 && // 한 문제도 못 풀었을 때
        (reason === 'timeout' || reason === 'manual_exit') // 타임아웃 또는 안전한 종료
      ) {
        refundStamina().then((res) => {
          if (res.success) {
            setToastValue('첫 문제 도전 실패로 스태미나가 반환되었습니다.');
            animations.setShowSlideToast(true);
            setTimeout(() => animations.setShowSlideToast(false), 2000);
          }
        });
      }

      // 2. 원래 게임 오버 호출
      stableHandleGameOver(reason);
    },
    [gameState.totalQuestions, refundStamina, stableHandleGameOver, animations]
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
    setToastValue,
    setDamagePosition: animations.setDamagePosition,
    setAnswerInput,
    increaseScore,
    decreaseScore,
    generateNewQuestion,
    handleGameOver: smartHandleGameOver, // Check refund logic first
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
      // 항상 팁 모달을 보여줍니다 (다시 보지 않기 제거됨)
      setShowTipModal(true);
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

  // Preview 모드 처리는 QuizPreview 컴포넌트로 위임

  // Preview 모드일 때 렌더링
  if (isPreview) {
    return (
      <QuizPreview
        categoryParam={categoryParam}
        subParam={subParam}
        levelParam={levelParam}
        category={category}
        topic={topic}
        keyboardType={previewKeyboardType} // Using local state initialized from store
        navigate={navigate}
        useSystemKeyboard={useSystemKeyboard}
      />
    );
  }

  return (
    <div className="quiz-page">
      <QuizModals
        feedbackRef={feedbackRef}
        showLastChanceModal={showLastChanceModal}
        gameMode={gameMode}
        inventory={inventory}
        minerals={minerals}
        handleRevive={handleRevive}
        handlePurchaseAndRevive={handlePurchaseAndRevive}
        handleGiveUp={handleGiveUp}
        showCountdown={showCountdown}
        handleCountdownComplete={handleCountdownComplete}
        showSafetyRope={showSafetyRope}
        setShowSafetyRope={setShowSafetyRope}
        categoryParam={categoryParam}
        subParam={subParam}
        levelParam={levelParam}
        showTipModal={showTipModal}
        handleBack={handleBack}
        handleStartGame={handleStartGame}
        showStaminaModal={showStaminaModal}
        handleWatchAd={handleStaminaAdRecovery}
        // Pause System
        showPauseModal={showPauseModal}
        remainingPauses={remainingPauses}
        handlePauseClick={handlePauseClick}
        handlePauseResume={handlePauseResume}
        handlePauseExit={handlePauseExit}
        // Missing Props Fix
        setShowStaminaModal={setShowStaminaModal}
        handlePlayAnyway={handlePlayAnyway}
      />

      {/* Pause Exit Confirm Toast */}
      {showPauseExitConfirm && (
        <ConfirmModal
          isOpen={true}
          title="게임 중단"
          message={`게임을 중단하시겠습니까?${'\n'}지금 나가면 진행 상황이 저장되지 않습니다.`}
          onConfirm={handleConfirmExit}
          onCancel={() => setShowPauseExitConfirm(false)}
          confirmText="나가기"
          cancelText="취소"
          variant="danger"
        />
      )}
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
        totalQuestions={gameState.totalQuestions}
        lives={lives}
        isSubmitting={isSubmitting}
        isError={animations.isError}
        useSystemKeyboard={useSystemKeyboard}
        showTipModal={showTipModal}
        isPaused={isTimerPaused}
        isInputPaused={isInputPaused}
        showExitConfirm={showExitConfirm}
        isFadingOut={isFadingOut}
        showAnswer={isAdminMode}
        cardAnimation={animations.cardAnimation}
        inputAnimation={animations.inputAnimation}
        questionAnimation={animations.questionAnimation}
        showFlash={animations.showFlash}
        showSlideToast={animations.showSlideToast}
        toastValue={toastValue}
        damagePosition={animations.damagePosition}
        generateNewQuestion={generateNewQuestion}
        handleSubmit={handleSubmit}
        handleGameOver={stableHandleGameOver}
        handleKeypadNumber={inputHandlers.handleKeypadNumber}
        handleQwertyKeyPress={inputHandlers.handleQwertyKeyPress}
        handleKeypadClear={inputHandlers.handleKeypadClear}
        handleKeypadBackspace={inputHandlers.handleKeypadBackspace}
        inputRef={inputRef}
        exitConfirmTimeoutRef={exitConfirmTimeoutRef}
        setAnswerInput={setAnswerInput}
        setDisplayValue={setDisplayValue}
        setShowExitConfirm={setShowExitConfirm}
        setIsFadingOut={setIsFadingOut}
        // New Props for Pause/Layout
        onPause={handlePauseClick}
      />
      <ConfirmModal
        isOpen={showPauseExitConfirm}
        title="게임 종료"
        message="게임을 종료하시겠습니까? 현재까지의 기록이 유실될 수 있습니다."
        confirmText="종료하기"
        cancelText="계속하기"
        onConfirm={handleConfirmExit}
        onCancel={() => setShowPauseExitConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
