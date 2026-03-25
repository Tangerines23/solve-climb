// src/pages/QuizPage.tsx (범용 퀴즈 페이지)
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './QuizPage.css';
import { useQuizStore } from '@/stores/useQuizStore';
import { QuizCard } from '@/components/QuizCard';
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
import type { Category, World } from '@/types/quiz';
import { AdService } from '@/utils/adService';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
} from '@/utils/urlParams';
import { QuizQuestion } from '@/types/quiz';
import { QuizPreview } from '@/components/quiz/QuizPreview';
import { QuizModals } from '@/components/quiz/QuizModals';
import { useBaseCampStore } from '@/stores/useBaseCampStore';
import { TodaysPromise } from '@/components/quiz/TodaysPromise';
import { FeverEffect } from '@/components/effects/FeverEffect';
import { TutorialOverlay, TutorialStep } from '@/components/tutorial/TutorialOverlay';
import { useQuizNavigation } from '@/hooks/useQuizNavigation';
import { useQuizStartLogic } from '@/hooks/useQuizStartLogic';
import { useQuizSession } from '@/hooks/useQuizSession';
import { useQuizGameplay } from '@/hooks/useQuizGameplay';
import { UI_MESSAGES, TUTORIAL_STEPS } from '@/constants/ui';
import { storageService, STORAGE_KEYS } from '@/services';

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

  const handleWatchAdRevive = useCallback(async () => {
    animations.setShowSlideToast(true);
    setToastValue(UI_MESSAGES.AD_WATCH_START);

    const adResult = await AdService.showRewardedAd('revive');

    if (adResult.success) {
      animations.setShowSlideToast(true);
      setToastValue(UI_MESSAGES.AD_WATCH_COMPLETE);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } else {
      setToastValue(UI_MESSAGES.AD_WATCH_FAILED(adResult.error));
      return false;
    }
  }, [animations]);

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
        const categoryMax = CATEGORY_CONFIG[cat]?.maxLevel || CATEGORY_CONFIG.default.maxLevel;
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

  const smartHandleGameOver = useCallback(
    async (reason?: string) => {
      if (gameState.totalQuestions === 0 && (reason === 'timeout' || reason === 'manual_exit')) {
        try {
          const res = await refundStamina();
          if (res.success) {
            showGlobalToast(UI_MESSAGES.STAMINA_REFUNDED, '🫧');
          }
        } catch (error) {
          console.error('[QuizPage] Refund error:', error);
        }
      }
      gameState.handleGameOver(reason);
    },
    [gameState, refundStamina, showGlobalToast]
  );

  const handleStaminaAdRecovery = useCallback(
    async (setShowStaminaModal: (s: boolean) => void) => {
      animations.setShowSlideToast(true);
      setToastValue(UI_MESSAGES.AD_WATCH_START);

      const adResult = await AdService.showRewardedAd('stamina_recharge');

      if (adResult.success) {
        const result = await recoverStaminaAds();
        if (result.success) {
          setShowStaminaModal(false);
          animations.setShowSlideToast(true);
          setToastValue(UI_MESSAGES.STAMINA_RECHARGED_FULL);
          setTimeout(() => window.location.reload(), ANIMATION_CONFIG.RELOAD_DELAY);
        } else {
          setToastValue('충전 실패: ' + result.message);
        }
      } else {
        setToastValue(UI_MESSAGES.AD_WATCH_FAILED(adResult.error));
      }
    },
    [animations, recoverStaminaAds]
  );

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
    answerInput,
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
        penaltyAmount={GAME_CONFIG.PENALTY_AMOUNT}
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
        isPaused={
          showTipModal || showLastChanceModal || showCountdown || isFlarePaused || showPauseModal
        }
        isInputPaused={showTipModal || showLastChanceModal || showCountdown || showPauseModal}
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
        handleGameOver={stableHandleGameOver}
        handleKeypadNumber={handleKeypadNumber}
        handleQwertyKeyPress={(k) => {
          setAnswerInput((p) => (p + k).slice(0, GAME_CONFIG.MAX_ANSWER_LENGTH_KEYBOARD));
          setDisplayValue((p) => (p + k).slice(0, GAME_CONFIG.MAX_ANSWER_LENGTH_KEYBOARD));
        }}
        handleKeypadClear={() => {
          setAnswerInput('');
          setDisplayValue('');
        }}
        handleKeypadBackspace={() => {
          setAnswerInput((p) => p.slice(0, -1));
          setDisplayValue((p) => p.slice(0, -1));
        }}
        inputRef={inputRef}
        exitConfirmTimeoutRef={{ current: null }}
        setAnswerInput={setAnswerInput}
        setDisplayValue={setDisplayValue}
        setShowExitConfirm={() => {}}
        setIsFadingOut={() => {}}
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
      <FeverEffect />
      <TutorialOverlay
        isVisible={showTutorial}
        steps={tutorialSteps}
        onComplete={() => setShowTutorial(false)}
      />
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
