import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { useNavigation } from '@/hooks/useNavigation';
import { QuizDisplayState, QuizAnimationState, QuizHandlers } from '../../types/quizProps';
import { QuizQuestion, Category } from '../../types/quiz';
import { ItemFeedbackRef } from '../game/ItemFeedbackOverlay';
import { QuizCard } from '../QuizCard';
import { QuizContext } from '../../contexts/QuizContext';
import './QuizPreview.css';

interface QuizPreviewProps {
  mountainParam: string | null;
  categoryParam: string | null;
  worldParam: string | null;
  subParam: string | null;
  levelParam: number | null;
  category: string | null;
  topic: string | null;
  keyboardType: 'custom' | 'qwerty';
  navigate: NavigateFunction;
  useSystemKeyboard: boolean;
}

// topicMap을 컴포넌트 외부로 이동하여 보안 린트 에러(Object Injection) 해결
const ARITHMETIC_TOPIC_MAP = new Map<number, string>([
  [1, '덧셈'],
  [2, '뺄셈'],
  [3, '덧셈'],
  [4, '뺄셈'],
  [5, '곱셈'],
  [6, '나눗셈'],
  [7, '혼합 연산'],
  [8, '곱셈'],
  [9, '나눗셈'],
  [10, '종합 연산'],
]);

export function QuizPreview({
  mountainParam,
  categoryParam,
  worldParam,
  subParam,
  levelParam,
  category,
  topic,
  keyboardType,
  navigate,
  useSystemKeyboard,
}: QuizPreviewProps) {
  const { urls } = useNavigation();
  const [previewKeyboardType, setPreviewKeyboardType] = useState<'custom' | 'qwerty'>(
    () => keyboardType
  );
  const [answerInput, setAnswerInput] = useState('');
  const [displayValue, setDisplayValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<ItemFeedbackRef>(null);

  // Preview 모드용 변수들
  const isJapaneseQuizPreview = categoryParam === 'language' && subParam === 'japanese';

  // displayCategory와 displayTopic 계산
  const displayCategoryPreview = useMemo(() => {
    if (mountainParam) {
      const mountainMap = APP_CONFIG.MOUNTAIN_MAP as Record<string, string>;
      if (Object.prototype.hasOwnProperty.call(mountainMap, mountainParam)) {
        return mountainMap[mountainParam];
      }
    }
    if (!categoryParam) return category || '연습';

    const worldMap = APP_CONFIG.WORLD_MAP as Record<string, string>;
    const mountainMap = APP_CONFIG.MOUNTAIN_MAP as Record<string, string>;
    const categoryMap = APP_CONFIG.CATEGORY_MAP as Record<string, string>;

    if (Object.prototype.hasOwnProperty.call(worldMap, categoryParam))
      return worldMap[categoryParam];
    if (Object.prototype.hasOwnProperty.call(mountainMap, categoryParam))
      return mountainMap[categoryParam];
    if (Object.prototype.hasOwnProperty.call(categoryMap, categoryParam))
      return categoryMap[categoryParam];

    return category || '연습';
  }, [mountainParam, categoryParam, category]);

  const displayTopicPreview = useMemo(() => {
    if (!categoryParam || !subParam) return topic || '미리보기';
    if (categoryParam === 'arithmetic') {
      return APP_CONFIG.CATEGORY_MAP['기초'] || '기초 (Training)';
    }
    if (subParam.startsWith('World')) {
      const worldName = APP_CONFIG.WORLD_MAP[subParam as keyof typeof APP_CONFIG.WORLD_MAP];
      if (worldName) return worldName;
    }
    const catName = APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
    if (catName) return catName;
    if (categoryParam === 'arithmetic' && levelParam !== null) {
      return ARITHMETIC_TOPIC_MAP.get(levelParam) || '사칙연산';
    }
    return topic || '미리보기';
  }, [categoryParam, subParam, levelParam, topic]);

  // 키보드 타입 동기화
  useEffect(() => {
    setPreviewKeyboardType(keyboardType);
  }, [keyboardType]);

  const handlePrevKeyboard = useCallback(() => {
    setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
  }, []);

  const handleNextKeyboard = useCallback(() => {
    setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
  }, []);

  const canSwitchKeyboard = !isJapaneseQuizPreview;
  const currentPreviewType = isJapaneseQuizPreview ? 'qwerty' : previewKeyboardType;

  // Handlers for preview
  const handlePreviewKeyPress = useCallback((key: string) => {
    setAnswerInput((prev) => (prev + key).slice(0, 10));
    setDisplayValue((prev) => (prev + key).slice(0, 10));
  }, []);

  const handlePreviewClear = useCallback(() => {
    setAnswerInput('');
    setDisplayValue('');
  }, []);

  const handlePreviewBackspace = useCallback(() => {
    setAnswerInput((prev) => prev.slice(0, -1));
    setDisplayValue((prev) => prev.slice(0, -1));
  }, []);

  const mockQuestion: QuizQuestion = {
    question: '12 + 34 = ?',
    answer: '46',
    category: category as Category,
  };

  const quizPreviewState: QuizDisplayState = {
    currentQuestion: mockQuestion,
    answerInput,
    displayValue,
    category: displayCategoryPreview as Category,
    topic: displayTopicPreview,
    categoryParam,
    worldParam,
    subParam,
    levelParam,
    gameMode: 'base-camp',
    timeLimit: 10,
    questionKey: 0,
    timerResetKey: 0,
    totalQuestions: 1,
    lives: 3,
    useSystemKeyboard,
    keyboardType: currentPreviewType,
    altitudePhase: 'ground',
    activeLandmark: null,
    remainingPauses: 3,
  };

  const quizAnimations: QuizAnimationState = {
    isSubmitting: false,
    isError: false,
    isPaused: true, // Preview is "paused" by default to stop timer
    isInputPaused: false,
    showExitConfirm: false,
    isFadingOut: false,
    cardAnimation: '',
    inputAnimation: '',
    questionAnimation: '',
    showFlash: false,
    showSlideToast: false,
    toastValue: '',
    damagePosition: { left: '50%', top: '50%' },
  };

  const quizHandlers: QuizHandlers = {
    onSafetyRopeUsed: () => {},
    onLastSpurt: () => {},
    onPause: () => navigate(urls.myPage()), // Pause button acts as back in preview
    generateNewQuestion: () => {},
    handleSubmit: (e?: React.FormEvent) => {
      e?.preventDefault();
      console.log('Preview submit');
    },
    handleGameOver: () => {},
    handleKeypadNumber: handlePreviewKeyPress,
    handleQwertyKeyPress: handlePreviewKeyPress,
    handleKeypadClear: handlePreviewClear,
    handleKeypadBackspace: handlePreviewBackspace,
  };

  return (
    <QuizContext.Provider
      value={{
        quizState: quizPreviewState,
        quizAnimations,
        quizHandlers,
        modalState: {
          showLastChanceModal: false,
          showCountdown: false,
          showSafetyRope: false,
          showTipModal: false,
          showPauseModal: false,
          showStaminaModal: false,
          showTutorial: false,
          showPromise: false,
        },
        modalHandlers: {
          handleRevive: async () => {},
          handlePurchaseAndRevive: async () => {},
          handleWatchAdAndRevive: async () => {},
          handleGiveUp: async () => {},
          handleCountdownComplete: () => {},
          setShowSafetyRope: () => {},
          handleBack: () => {},
          handleStartGame: async () => {},
          handlePauseResume: () => {},
          handlePauseExit: () => {},
          setShowStaminaModal: () => {},
          onAlertAction: () => {},
          handlePromiseComplete: () => {},
          setShowTutorial: () => {},
        },
        inputRef,
        feedbackRef,
        inventory: [],
        minerals: 0,
        isAnonymous: true,
        feverLevel: 0,
        altitudePhase: 'ground',
        promiseData: null,
        activeItems: [],
        usedItems: [],
        score: 0,
        isExhausted: false,
        handleTimeUp: () => {},
        setAnswerInput,
        setDisplayValue,
        setShowExitConfirm: () => {},
        setIsFadingOut: () => {},
        cancelExitConfirm: () => {},
      }}
    >
      <div
        className="quiz-page"
        data-world={subParam || 'World1'}
        data-category={categoryParam || ''}
      >
        <QuizCard />

        {/* Keyboard Switcher Overlay (Only for Preview) */}
        {canSwitchKeyboard && (
          <div className="preview-keyboard-switcher">
            <button onClick={handlePrevKeyboard} className="preview-nav-button">
              ‹
            </button>
            <span className="preview-nav-label">
              {currentPreviewType === 'custom' ? '커스텀 키패드' : '쿼티 키보드'}
            </span>
            <button onClick={handleNextKeyboard} className="preview-nav-button">
              ›
            </button>
          </div>
        )}
      </div>
    </QuizContext.Provider>
  );
}
