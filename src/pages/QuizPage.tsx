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
import { useQuizRevive } from '@/hooks/useQuizRevive';
import { useUserStore } from '@/stores/useUserStore';
import { useGameStore } from '@/stores/useGameStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { useToastStore } from '@/stores/useToastStore';
import type { Category, World } from '@/types/quiz';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
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
  const [_gameQuestions, setGameQuestions] = useState<
    Array<{ id: string; question: QuizQuestion; userAnswer: number | null }>
  >([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  const {
    stamina,
    inventory,
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
    setToastValue('시뮬레이션 모드에서는 광고 없이 충전됩니다! 🫧');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const result = await recoverStaminaAds();
    if (result.success) {
      setShowStaminaModal(false);
      // setToastValue('산소통(스태미나)이 충전되었습니다! 🫧'); // redundant with above
      setTimeout(() => window.location.reload(), 500);
    } else {
      setToastValue('충전 실패: ' + result.message);
    }
  }, [animations, recoverStaminaAds]);

  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isFlarePaused, setIsFlarePaused] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [remainingPauses, setRemainingPauses] = useState(3);
  const [showPromise, setShowPromise] = useState(false);
  const [promiseData, setPromiseData] = useState({ rule: '', example: '' });

  const {
    setExhausted,
    resetGame,
    setActiveItems,
    incrementCombo,
    setCombo,
    isStaminaConsumed,
    setStaminaConsumed,
  } = useGameStore();

  const [questionKey, setQuestionKey] = useState(0);
  const [timerResetKey, setTimerResetKey] = useState(0);
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
  const landmarkMapping = useMemo(
    () => ({
      100: { icon: '🌲', text: '첫 번째 숲 (100m)' },
      300: { icon: '☁️', text: '구름 위 (300m)' },
      500: { icon: '🏔️', text: '정상 정복 예정 (500m)' },
      1000: { icon: '🏆', text: '전설의 시작 (1000m)' },
    }),
    []
  );

  useEffect(() => {
    if (gameMode !== 'survival') return;
    const altitude = gameState.totalQuestions * 10;
    const landmark = landmarkMapping[altitude as keyof typeof landmarkMapping];
    if (landmark) {
      setActiveLandmark(landmark);
      setTimeout(() => setActiveLandmark(null), 2500);
    }
  }, [gameState.totalQuestions, gameMode, landmarkMapping]);

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
      setGameQuestions((prev) => [...prev, { id: questionId, question, userAnswer: null }]);
      gameState.setQuestionIds((prev) => [...prev, questionId]);
      setCurrentQuestionId(questionId);
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
    isPreview,
  });

  const { handleRevive, handlePurchaseAndRevive, handleGiveUp, stableHandleGameOver } = revive;

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
    feedbackRef.current?.show('문제 교체!', '문제가 변경되었습니다.', 'info');
  }, []);

  const handlePauseExit = useCallback(() => {
    setShowPauseModal(false);
    // 그만하기 클릭 시에도 환불 로직 보장 위해 smartHandleGameOver 호출
    smartHandleGameOver('manual_exit');
  }, [smartHandleGameOver]);

  const handleCountdownComplete = useCallback(() => {
    setCombo(20);
    setShowCountdown(false);
  }, [setCombo]);
  const handleSafetyRopeUsed = useCallback(() => {
    setShowSafetyRope(true);
    if (gameMode === 'time-attack') setTimerResetKey((prev) => prev + 1);
  }, [gameMode]);

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
    onAnswerSubmitted: (questionId, userAnswer) => {
      setGameQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, userAnswer } : q)));
      gameState.setUserAnswers((prev) => [...prev, userAnswer]);
    },
    currentQuestionId,
  });

  const handleStartGame = async (selectedItemIds: number[]) => {
    if (stamina <= 0) {
      setPendingItemIds(selectedItemIds);
      setShowStaminaModal(true);
      return;
    }

    // [New] Logic Phase 3 "Today's Promise" Check
    if (categoryParam === '논리' && levelParam && levelParam >= 11 && levelParam <= 15) {
      const rules: Record<number, { rule: string; example: string }> = {
        11: { rule: '절댓값: 부호 떼고 크기만!', example: '|-5| = 5' },
        12: { rule: '나머지(Mod): 나눈 후 남는 조각!', example: '14 mod 3 = 2' },
        13: { rule: '팩토리얼(!): 1부터 몽땅 곱하기!', example: '3! = 3x2x1 = 6' },
        14: { rule: '사용자 연산: 기호 약속 지키기!', example: 'A ★ B = A+B+1' },
      };
      const rule = rules[levelParam] || { rule: '논리왕: 모든 규칙 혼합!', example: '팩토리얼 + 나머지' };
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
        if (res.success) activeCodes.push(item.code);
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
    }

    gameStateRef.current.setTotalQuestions(0);
    gameStateRef.current.setWrongAnswers([]);
    gameStateRef.current.setSolveTimes([]);
    gameStateRef.current.setQuestionStartTime(null);
    setSessionCreated(false);
    isCreatingSessionRef.current = false;
    setGameQuestions([]);
    setCurrentQuestionId(null);
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

  return (
    <div
      className={`quiz-page fever-level-${feverLevel}`}
      data-world={worldParam || world || 'World1'}
      data-category={categoryParam || ''}
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
        timeLimit={timeLimit}
        questionKey={questionKey}
        timerResetKey={timerResetKey}
        SURVIVAL_QUESTION_TIME={5}
        totalQuestions={gameState.totalQuestions}
        lives={lives}
        onSafetyRopeUsed={handleSafetyRopeUsed}
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
        showStaminaModal={showStaminaModal}
        setShowStaminaModal={setShowStaminaModal}
        handlePlayAnyway={handlePlayAnyway}
        handleWatchAd={handleStaminaAdRecovery}
        showPauseModal={showPauseModal}
        remainingPauses={remainingPauses}
        handlePauseClick={handlePauseClick}
        handlePauseResume={handlePauseResume}
        handlePauseExit={handlePauseExit}
      />

      <TodaysPromise
        isVisible={showPromise}
        rule={promiseData.rule}
        example={promiseData.example}
        onComplete={handlePromiseComplete}
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
