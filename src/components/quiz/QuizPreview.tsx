import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { urls } from '../../utils/navigation';
import { QuizDisplayState, QuizAnimationState, QuizHandlers } from '../../types/quizProps';
import { QuizQuestion } from '../../types/quiz';
import { QuizCard } from '../QuizCard';
import './QuizPreview.css';

interface QuizPreviewProps {
  mountainParam: string | null;
  categoryParam: string | null;
  subParam: string | null;
  levelParam: number | null;
  category: string | null;
  topic: string | null;
  keyboardType: 'custom' | 'qwerty';
  navigate: NavigateFunction;
  useSystemKeyboard: boolean;
}

export function QuizPreview({
  mountainParam,
  categoryParam,
  subParam,
  levelParam,
  category,
  topic,
  keyboardType,
  navigate,
  useSystemKeyboard,
}: QuizPreviewProps) {
  const [previewKeyboardType, setPreviewKeyboardType] = useState<'custom' | 'qwerty'>(
    () => keyboardType
  );
  const [answerInput, setAnswerInput] = useState('');
  const [displayValue, setDisplayValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preview 모드용 변수들
  const isJapaneseQuizPreview = categoryParam === 'language' && subParam === 'japanese';

  // displayCategory와 displayTopic 계산
  const displayCategoryPreview = useMemo(() => {
    if (mountainParam) {
      const mountainName =
        APP_CONFIG.MOUNTAIN_MAP[mountainParam as keyof typeof APP_CONFIG.MOUNTAIN_MAP];
      if (mountainName) return mountainName;
    }
    if (!categoryParam) return category || '연습';
    return (
      APP_CONFIG.WORLD_MAP[categoryParam as keyof typeof APP_CONFIG.WORLD_MAP] ||
      APP_CONFIG.MOUNTAIN_MAP[categoryParam as keyof typeof APP_CONFIG.MOUNTAIN_MAP] ||
      APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
      category ||
      '연습'
    );
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
      return topicMap[levelParam] || '사칙연산';
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
    category: category as any,
  };

  const quizPreviewState: QuizDisplayState = {
    currentQuestion: mockQuestion,
    answerInput,
    displayValue,
    category: displayCategoryPreview as any,
    topic: displayTopicPreview,
    categoryParam,
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
    handleSubmit: (e) => {
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
    <div
      className="quiz-page"
      data-world={subParam || 'World1'}
      data-category={categoryParam || ''}
    >
      <QuizCard
        quizState={quizPreviewState}
        quizAnimations={quizAnimations}
        quizHandlers={quizHandlers}
        inputRef={inputRef}
        exitConfirmTimeoutRef={exitConfirmTimeoutRef}
        setAnswerInput={setAnswerInput}
        setDisplayValue={setDisplayValue}
        setShowExitConfirm={() => {}}
        setIsFadingOut={() => {}}
        SURVIVAL_QUESTION_TIME={10}
        activeItems={[]}
        usedItems={[]}
        score={0}
        isExhausted={false}
        handleTimeUp={() => {}}
      />

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
  );
}
