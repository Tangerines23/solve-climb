// src/pages/QuizPage.tsx (범용 퀴즈 페이지)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './QuizPage.css';
import { useQuizStore, type TimeLimit } from '../stores/useQuizStore';
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
import type { Category, World } from '../types/quiz';
import { ItemFeedbackRef } from '../components/game/ItemFeedbackOverlay';
import { supabase } from '../utils/supabaseClient';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
} from '../utils/urlParams';
import { QuizQuestion } from '../types/quiz';
import { QuizPreview } from '../components/quiz/QuizPreview';
import { QuizModals } from '../components/quiz/QuizModals';

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

  const animations = useQuizAnimations();

  const handleStaminaAdRecovery = useCallback(async () => {
    const adDuration = 2500;
    animations.setShowSlideToast(true);
    setToastValue('광고 시청 중... (Mock)');
    await new Promise((resolve) => setTimeout(resolve, adDuration));
    const result = await recoverStaminaAds();
    if (result.success) {
      setShowStaminaModal(false);
      setToastValue('산소통(스태미나)이 충전되었습니다! 🫧');
      setTimeout(() => window.location.reload(), 1000);
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

  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    onQuestionGenerated: (question, questionId) => {
      setGameQuestions((prev) => [...prev, { id: questionId, question, userAnswer: null }]);
      gameState.setQuestionIds((prev) => [...prev, questionId]);
      setCurrentQuestionId(questionId);
    },
  });

  const generateNewQuestionRef = useRef(generateNewQuestion);
  useEffect(() => { generateNewQuestionRef.current = generateNewQuestion; }, [generateNewQuestion]);

  const handleFlareInputStart = useCallback(() => { if (isFlarePaused) setIsFlarePaused(false); }, [isFlarePaused]);

  const handleBack = useCallback(() => {
    if (showExitConfirm) {
      if (exitConfirmTimeoutRef.current) clearTimeout(exitConfirmTimeoutRef.current);
      navigate(worldParam && categoryParam ? `/level-select?world=${worldParam}&category=${categoryParam}` : '/');
    } else {
      setToastValue('뒤로 가려면 한 번 더 누르세요');
      setShowExitConfirm(true);
      setTimeout(() => setIsFadingOut(true), 2500);
      exitConfirmTimeoutRef.current = setTimeout(() => {
        setShowExitConfirm(false);
        setIsFadingOut(false);
      }, 3000);
    }
  }, [showExitConfirm, worldParam, categoryParam, navigate]);

  const handlePauseClick = useCallback(() => {
    if (remainingPauses > 0) setShowPauseModal(true);
    else feedbackRef.current?.show('일시정지 횟수 초과!', '더 이상 일시정지할 수 없습니다.', 'info');
  }, [remainingPauses]);

  const handlePauseResume = useCallback(() => {
    setRemainingPauses((prev) => prev - 1);
    generateNewQuestionRef.current();
    setShowPauseModal(false);
    feedbackRef.current?.show('문제 교체!', '문제가 변경되었습니다.', 'info');
  }, []);

  const handlePauseExit = useCallback(() => {
    setShowPauseModal(false);
    navigate(worldParam && categoryParam ? `/level-select?world=${worldParam}&category=${categoryParam}` : '/');
  }, [navigate, worldParam, categoryParam]);

  const isTimerPaused = showTipModal || showLastChanceModal || showCountdown || isFlarePaused || showPauseModal;
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
  }, [gameState.handleGameOver, gameState.setTotalQuestions, gameState.setWrongAnswers, gameState.setSolveTimes]);

  const handleGameOverRef = useRef(gameState.handleGameOver);
  useEffect(() => { handleGameOverRef.current = gameState.handleGameOver; }, [gameState.handleGameOver]);

  const revive = useQuizRevive({
    gameMode,
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

  const smartHandleGameOver = useCallback((reason?: string) => {
    if (gameState.totalQuestions === 0 && (reason === 'timeout' || reason === 'manual_exit')) {
      refundStamina().then((res) => {
        if (res.success) {
          setToastValue('첫 문제 도전 실패로 스태미나가 반환되었습니다.');
          animations.setShowSlideToast(true);
          setTimeout(() => animations.setShowSlideToast(false), 2000);
        }
      });
    }
    stableHandleGameOver(reason);
  }, [gameState.totalQuestions, refundStamina, stableHandleGameOver, animations]);

  const handleCountdownComplete = useCallback(() => { setCombo(20); setShowCountdown(false); }, [setCombo]);
  const handleSafetyRopeUsed = useCallback(() => {
    setShowSafetyRope(true);
    if (gameMode === 'time-attack') setTimerResetKey((prev) => prev + 1);
  }, [gameMode]);

  const { handleSubmit } = useQuizSubmit({
    answerInput, isSubmitting, currentQuestion, categoryParam: categoryParam || '', subParam: '', gameMode,
    questionStartTime: gameState.questionStartTime, hapticEnabled, useSystemKeyboard, setIsSubmitting,
    setCardAnimation: animations.setCardAnimation, onSafetyRopeUsed: handleSafetyRopeUsed, setInputAnimation: animations.setInputAnimation,
    setDisplayValue, setIsError: animations.setIsError, setShowFlash: animations.setShowFlash, setShowSlideToast: animations.setShowSlideToast,
    setToastValue, setDamagePosition: animations.setDamagePosition, setAnswerInput, increaseScore, decreaseScore, generateNewQuestion,
    handleGameOver: smartHandleGameOver, setTotalQuestions: gameStateSettersRef.current.setTotalQuestions, setWrongAnswers: gameStateSettersRef.current.setWrongAnswers,
    setSolveTimes: gameStateSettersRef.current.setSolveTimes, inputRef, showFeedback: (text, subText, type) => feedbackRef.current?.show(text, subText, type),
    setIsFlarePaused, onAnswerSubmitted: (questionId, userAnswer) => {
      setGameQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, userAnswer } : q)));
      gameState.setUserAnswers((prev) => [...prev, userAnswer]);
    },
    currentQuestionId,
  });

  const handleStartGame = async (selectedItemIds: number[]) => {
    if (stamina <= 0) { setPendingItemIds(selectedItemIds); setShowStaminaModal(true); return; }
    const res = await consumeStamina();
    if (!res.success) { setPendingItemIds(selectedItemIds); setShowStaminaModal(true); return; }
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
      useQuizStore.getState().setTimeLimit((valid.find(l => l >= current + 10) || 180) as TimeLimit);
    }
    if (activeCodes.includes('power_gel')) incrementCombo();
    setShowTipModal(false); setShowStaminaModal(false);
  };

  const handlePlayAnyway = async () => { setExhausted(true); await startWithItems(pendingItemIds); };

  useEffect(() => {
    if (worldParam && categoryParam && levelParam !== null) setQuizContext(categoryParam as Category, worldParam as World, levelParam);
  }, [worldParam, categoryParam, levelParam, setQuizContext]);

  useEffect(() => {
    resetQuiz(); resetGame(); checkStamina().then(() => { if (stamina <= 0) setExhausted(true); });
    gameStateRef.current.setTotalQuestions(0); gameStateRef.current.setWrongAnswers([]); gameStateRef.current.setSolveTimes([]);
    gameStateRef.current.setQuestionStartTime(null); setSessionCreated(false); isCreatingSessionRef.current = false;
    setGameQuestions([]); setCurrentQuestionId(null);
  }, [worldParam, categoryParam, levelParam, resetQuiz]);

  const [sessionCreated, setSessionCreated] = useState(false);
  const isCreatingSessionRef = useRef(false);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    if (!showTipModal && worldParam && categoryParam && levelParam !== null && modeParam && !sessionCreated && !isCreatingSessionRef.current) {
      isCreatingSessionRef.current = true;
      (async () => {
        try {
          const mode = modeParam.includes('time') ? 'timeattack' : 'survival';
          const { infiniteStamina } = useDebugStore.getState();
          const { data } = await supabase.rpc('create_game_session', {
            p_questions: [], p_category: categoryParam, p_subject: worldParam, p_level: levelParam, p_game_mode: mode, p_is_debug_session: infiniteStamina,
          });
          if (data?.session_id) { gameState.setGameSessionId(data.session_id); setSessionCreated(true); }
        } finally { isCreatingSessionRef.current = false; }
      })();
    }
  }, [showTipModal, worldParam, categoryParam, levelParam, modeParam, sessionCreated, gameState]);

  useEffect(() => { if (!showTipModal && !sessionCreated) setTimeout(() => generateNewQuestionRef.current(), 50); }, [showTipModal, sessionCreated]);

  useEffect(() => { if (modeParam) setGameMode(modeParam.includes('time') ? 'time-attack' : 'survival'); }, [modeParam, setGameMode]);

  useEffect(() => {
    if (isPreview || isStaminaConsumed) return;
    setStaminaConsumed(true);
    (async () => {
      await checkStamina();
      if (useUserStore.getState().stamina <= 0) { setShowStaminaModal(true); setExhausted(true); }
      else { setExhausted(false); await consumeStamina(); }
    })();
  }, [isPreview, checkStamina, consumeStamina, isStaminaConsumed, setExhausted, setStaminaConsumed]);

  if (isPreview) return <QuizPreview categoryParam={categoryParam || ''} subParam={worldParam || ''} levelParam={levelParam} category={category || '기초'} topic={`${worldParam}-${categoryParam}` as any} keyboardType={previewKeyboardType} navigate={navigate} useSystemKeyboard={useSystemKeyboard} />;

  return (
    <div
      className="quiz-page"
      data-world={worldParam || world || 'World1'}
    >
      <QuizCard
        currentQuestion={currentQuestion} answerInput={answerInput} displayValue={displayValue}
        category={category} topic={`${worldParam}-${categoryParam}`} categoryParam={categoryParam} subParam={worldParam} levelParam={levelParam}
        gameMode={gameMode} timeLimit={timeLimit} questionKey={questionKey} timerResetKey={timerResetKey} SURVIVAL_QUESTION_TIME={5}
        totalQuestions={gameState.totalQuestions} lives={lives} onSafetyRopeUsed={handleSafetyRopeUsed} onPause={handlePauseClick}
        isSubmitting={isSubmitting} isError={animations.isError} useSystemKeyboard={useSystemKeyboard} showTipModal={showTipModal}
        isPaused={isTimerPaused} isInputPaused={isInputPaused} showExitConfirm={showExitConfirm} isFadingOut={isFadingOut}
        cardAnimation={animations.cardAnimation} inputAnimation={animations.inputAnimation} questionAnimation={animations.questionAnimation}
        showFlash={animations.showFlash} showSlideToast={animations.showSlideToast} toastValue={toastValue} damagePosition={animations.damagePosition}
        generateNewQuestion={generateNewQuestion} handleSubmit={handleSubmit} handleGameOver={smartHandleGameOver}
        handleKeypadNumber={(n) => { setAnswerInput(p => (p + n).slice(0, 6)); setDisplayValue(p => (p + n).slice(0, 6)); }}
        handleQwertyKeyPress={(k) => { setAnswerInput(p => (p + k).slice(0, 20)); setDisplayValue(p => (p + k).slice(0, 20)); }}
        handleKeypadClear={() => { setAnswerInput(''); setDisplayValue(''); }}
        handleKeypadBackspace={() => { setAnswerInput(p => p.slice(0, -1)); setDisplayValue(p => p.slice(0, -1)); }}
        inputRef={inputRef} exitConfirmTimeoutRef={exitConfirmTimeoutRef} setAnswerInput={setAnswerInput} setDisplayValue={setDisplayValue}
        setShowExitConfirm={setShowExitConfirm} setIsFadingOut={setIsFadingOut}
      />
      <QuizModals
        feedbackRef={feedbackRef} showLastChanceModal={showLastChanceModal} gameMode={gameMode} inventory={inventory} minerals={useUserStore.getState().minerals}
        handleRevive={handleRevive} handlePurchaseAndRevive={handlePurchaseAndRevive} handleGiveUp={handleGiveUp} showCountdown={showCountdown}
        handleCountdownComplete={handleCountdownComplete} showSafetyRope={showSafetyRope} setShowSafetyRope={setShowSafetyRope}
        categoryParam={categoryParam} subParam={worldParam} levelParam={levelParam} showTipModal={showTipModal} handleBack={handleBack}
        handleStartGame={handleStartGame} showStaminaModal={showStaminaModal} setShowStaminaModal={setShowStaminaModal}
        handlePlayAnyway={handlePlayAnyway} handleWatchAd={handleStaminaAdRecovery} showPauseModal={showPauseModal}
        remainingPauses={remainingPauses} handlePauseClick={handlePauseClick} handlePauseResume={handlePauseResume} handlePauseExit={handlePauseExit}
      />
    </div>
  );
}
