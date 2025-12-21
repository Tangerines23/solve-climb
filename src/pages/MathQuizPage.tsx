// src/pages/MathQuizPage.tsx (리팩토링 버전)
import { useState, useEffect, useRef, useCallback, useMemo, FormEvent } from 'react';
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
import { CustomKeypad } from '../components/CustomKeypad';
import { QwertyKeypad } from '../components/QwertyKeypad';
import { GameOverlay } from '../components/game/GameOverlay';
import { useUserStore } from '../stores/useUserStore';
import { useGameStore } from '../stores/useGameStore';
import { StaminaWarningModal } from '../components/game/StaminaWarningModal';
import { ItemFeedbackOverlay, ItemFeedbackRef } from '../components/game/ItemFeedbackOverlay';
import { APP_CONFIG } from '../config/app';
import {
  validateCategoryParam,
  validateSubTopicParam,
  validateLevelParam,
  validateModeParam,
  createSafeStorageKey,
} from '../utils/urlParams';
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
  const { stamina, inventory, checkStamina, consumeItem, consumeStamina } = useUserStore();
  const { setExhausted, resetGame, setActiveItems, incrementCombo } = useGameStore();
  const [questionKey, setQuestionKey] = useState(0);
  const [previewKeyboardType, setPreviewKeyboardType] = useState<'custom' | 'qwerty'>(() => keyboardType);

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
    showFeedback: (text: string, subText?: string, type?: 'success' | 'info') => feedbackRef.current?.show(text, subText, type),
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
      const mode = (String(modeParam) === 'time_attack' || modeParam === 'time-attack') ? 'time-attack' as const : 'survival' as const;
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
      const item = inventory.find((i: any) => i.id === id);
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
      useQuizStore.getState().setTimeLimit((currentTimeLimit + 10) as any);
    }

    if (activeCodes.includes('power_gel')) {
      incrementCombo(); // Start with 1 combo (Momentum)
    }

    // 4. Close modal and start quiz
    setShowTipModal(false);
    setShowStaminaModal(false);
    generateNewQuestion();
  };

  const handlePlayAnyway = async () => {
    setExhausted(true);
    await startWithItems(pendingItemIds);
  };

  const handleWatchAd = () => {
    // Placeholder for Ad logic
    alert('광고 시스템 준비 중입니다.');
  };

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
      ? APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] || category || ''
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
      const subTopicInfo = subTopics?.find(t => t.id === subParam);
      return subTopicInfo?.name || subParam;
    }
  }, [isPreview, categoryParam, subParam, levelParam, topic]);

  // Preview 모드에서 keyboardType 변경 시 previewKeyboardType 동기화
  useEffect(() => {
    if (isPreview) {
      setPreviewKeyboardType(keyboardType);
    }
  }, [isPreview, keyboardType]);

  // Preview 모드일 때 렌더링
  if (isPreview) {
    // Preview 모드에서 키보드 타입 전환 핸들러
    const handlePrevKeyboard = useCallback(() => {
      setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
    }, []);

    const handleNextKeyboard = useCallback(() => {
      setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
    }, []);

    // 일본어 퀴즈가 아닐 때만 키보드 타입 전환 가능
    const canSwitchKeyboard = !isJapaneseQuizPreview;
    const currentPreviewType = isJapaneseQuizPreview ? 'qwerty' : previewKeyboardType;

    return (
      <div className="math-quiz-page">
        <header className="math-quiz-header">
          <button
            className="math-quiz-back-button"
            onClick={() => navigate('/my-page')}
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <div className="math-quiz-timer-container" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
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
          <div className="math-quiz-header-spacer"></div>
        </header>

        <div className="math-quiz-content">
          {/* quiz-card - 인게임과 동일한 구조 */}
          <div className="quiz-card">
            <div className="category-label">{displayCategoryPreview} - {displayTopicPreview}</div>
            <form onSubmit={handlePreviewSubmit} style={{ display: 'contents' }}>
              <div>
                <h2 className="problem-text">
                  미리보기
                </h2>
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
    <div className="math-quiz-page">
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
