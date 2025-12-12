// src/pages/MathQuizPage.tsx (리팩토링 버전)
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './MathQuizPage.css';
import { useQuizStore } from '../stores/useQuizStore';
import { GameTipModal } from '../components/GameTipModal';
import { QuizCard } from '../components/QuizCard';
import { useQuestionGenerator } from '../hooks/useQuestionGenerator';
import { useQuizInput } from '../hooks/useQuizInput';
import { useQuizGameState } from '../hooks/useQuizGameState';
import { useQuizAnimations } from '../hooks/useQuizAnimations';
import { useQuizSubmit } from '../hooks/useQuizSubmit';
import { useSettingsStore } from '../stores/useSettingsStore';
import { storage } from '../utils/storage';
import {
  validateCategoryParam,
  validateSubTopicParam,
  validateLevelParam,
  validateModeParam,
  createSafeStorageKey,
} from '../utils/urlParams';
import { APP_CONFIG } from '../config/app';
import { QuizQuestion } from '../types/quiz';

export function MathQuizPage() {
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
  const [questionKey, setQuestionKey] = useState(0);
  
  const SURVIVAL_QUESTION_TIME = 5;
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // URL 파라미터에서 레벨 정보 읽기 및 검증
  const categoryParamRaw = searchParams.get('category');
  const subParamRaw = searchParams.get('sub');
  const levelParamRaw = searchParams.get('level');
  const modeParamRaw = searchParams.get('mode');

  const categoryParam = validateCategoryParam(categoryParamRaw);
  const subParam = validateSubTopicParam(categoryParam, subParamRaw);
  const levelParam = validateLevelParam(levelParamRaw, 20);
  const modeParam = validateModeParam(modeParamRaw);

  // 애니메이션 상태 관리
  const animations = useQuizAnimations();

  // 게임 상태 관리
  const gameState = useQuizGameState({
    score,
    gameMode,
    categoryParam,
    subParam,
    levelParam,
    modeParam,
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
  });

  // 키보드 입력 처리
  const inputHandlers = useQuizInput({
    answerInput,
    isSubmitting,
    isError: animations.isError,
    categoryParam,
    subParam,
    setAnswerInput,
    setDisplayValue,
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
  }, [gameState.handleGameOver, gameState.setTotalQuestions, gameState.setWrongAnswers, gameState.setSolveTimes]);
  
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
    handleGameOver: gameStateSettersRef.current.handleGameOver,
    setTotalQuestions: gameStateSettersRef.current.setTotalQuestions,
    setWrongAnswers: gameStateSettersRef.current.setWrongAnswers,
    setSolveTimes: gameStateSettersRef.current.setSolveTimes,
    inputRef,
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
      const mode = modeParam === 'time_attack' ? 'time-attack' : modeParam === 'survival' ? 'survival' : 'time-attack';
      setGameMode(mode);
    }
  }, [modeParam, setGameMode]);

  // URL 파라미터에서 category와 topic 설정
  useEffect(() => {
    if (categoryParam && subParam) {
      const categoryName = APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
      if (categoryName) {
        setCategoryTopic(categoryName as any, subParam as any);
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
  
  // 안정적인 handleGameOver 함수 (QuizCard에 전달)
  const stableHandleGameOver = useCallback(() => {
    handleGameOverRef.current();
  }, []);
  
  // 초기화 로직: categoryParam, subParam, levelParam이 변경될 때만 실행
  useEffect(() => {
    resetQuiz();
    gameStateRef.current.setTotalQuestions(0);
    gameStateRef.current.setWrongAnswers([]);
    gameStateRef.current.setSolveTimes([]);
    gameStateRef.current.setQuestionStartTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, subParam, levelParam, resetQuiz]);
  
  // showTipModal이 false가 되면 문제 생성
  useEffect(() => {
    if (!showTipModal) {
      // 약간의 지연을 두어 상태 업데이트가 완료된 후 실행
      const timer = setTimeout(() => {
        generateNewQuestionRef.current();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showTipModal]);

  const handleTipClose = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'MathQuizPage.tsx:251',
        message: 'handleTipClose called',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    setShowTipModal(false);
    // generateNewQuestion은 useEffect에서 showTipModal이 false가 되면 자동으로 호출됨
  }, []);

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

  return (
    <div className="math-quiz-page">
      {categoryParam && subParam && (
        <GameTipModal
          isOpen={showTipModal}
          category={categoryParam}
          subTopic={subParam}
          level={levelParam}
          onClose={handleTipClose}
        />
      )}
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
        SURVIVAL_QUESTION_TIME={SURVIVAL_QUESTION_TIME}
        isSubmitting={isSubmitting}
        isError={animations.isError}
        useSystemKeyboard={useSystemKeyboard}
        showTipModal={showTipModal}
        showExitConfirm={showExitConfirm}
        isFadingOut={isFadingOut}
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

