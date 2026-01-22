// 문제 생성 로직을 관리하는 커스텀 훅
import { useCallback } from 'react';
import { Category, QuizQuestion, Difficulty, GameMode, World } from '../types/quiz';
import { generateQuestion } from '../utils/quizGenerator';
import { useBaseCampStore } from '../stores/useBaseCampStore';
import { useDeathNoteStore } from '../stores/useDeathNoteStore';
import { SURVIVAL_CONFIG } from '../constants/game';

interface UseQuestionGeneratorParams {
  category: Category | null;
  world: World | null;
  difficulty: Difficulty;
  gameMode: GameMode;
  worldParam: string | null;
  categoryParam: string | null;
  levelParam: number | null;
  totalQuestions: number; // 현재 푼 문제 수
  useSystemKeyboard: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setCurrentQuestion: (question: QuizQuestion | null) => void;
  setAnswerInput: (value: string) => void;
  setDisplayValue: (value: string) => void;
  setIsError: (value: boolean) => void;
  setShowFlash: (value: boolean) => void;
  setQuestionAnimation: (value: string) => void;
  setQuestionKey: (updater: (prev: number) => number) => void;
  setQuestionStartTime: (time: number | null) => void;
  onQuestionGenerated?: (question: QuizQuestion, questionId: string) => void;
}

export function useQuestionGenerator({
  category,
  world,
  difficulty,
  gameMode,
  worldParam,
  categoryParam,
  levelParam,
  totalQuestions,
  useSystemKeyboard,
  inputRef,
  setCurrentQuestion,
  setAnswerInput,
  setDisplayValue,
  setIsError,
  setShowFlash,
  setQuestionAnimation,
  setQuestionKey,
  setQuestionStartTime,
  onQuestionGenerated,
}: UseQuestionGeneratorParams) {
  // effectiveLevel calculation moved inside generateNewQuestion to react to totalQuestions correctly

  // ... (inside useQuestionGenerator)
  const generateNewQuestion = useCallback(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    const isBaseCamp = mode === 'base-camp';
    const isSmartRetry = mode === 'smart-retry';

    if (isBaseCamp) {
      const { questions, currentQuestionIndex, setCompleted } = useBaseCampStore.getState();

      // 진단 종료 체크
      if (currentQuestionIndex >= 10) {
        setCompleted(true);
        // 결과 취합을 위해 약간 지연 후 이동 (submitAnswer에서 처리될 것임)
        return;
      }

      const q = questions[currentQuestionIndex];
      if (q) {
        setQuestionAnimation('fade-out');
        setTimeout(() => {
          setCurrentQuestion(q);
          setAnswerInput('');
          setDisplayValue('');
          setIsError(false);
          setShowFlash(false);
          setQuestionAnimation('fade-in');
          setQuestionStartTime(Date.now());
        }, 150);
        return;
      }
    }

    if (isSmartRetry) {
      const targetWorld = (worldParam || world) as World;
      const targetCategory = (categoryParam || category) as Category;
      const { getQuestionsByCategory } = useDeathNoteStore.getState();
      const missedQuestions = getQuestionsByCategory(targetWorld, targetCategory);

      if (missedQuestions.length > 0) {
        // 무작위로 하나 선택하거나 순차적으로? 일단 무작위
        const randomIndex = Math.floor(Math.random() * missedQuestions.length);
        const q = missedQuestions[randomIndex];

        setQuestionAnimation('fade-out');
        setTimeout(() => {
          setCurrentQuestion(q);
          setAnswerInput('');
          setDisplayValue('');
          setIsError(false);
          setShowFlash(false);
          setQuestionAnimation('fade-in');
          setQuestionStartTime(Date.now());
        }, 150);
        return;
      }
      // 오답이 없으면 일반 모드로 전환 (콘솔 알림)
      console.log('No missed questions found for smart-retry, falling back to normal mode');
    }

    // 2. 일반 월드/카테고리/레벨 결정 (파라미터 우선, 없으면 스토어 값 사용)
    const targetWorld = (worldParam || world) as World;
    const targetCategory = (categoryParam || category) as Category;

    let targetLevel = levelParam || 1;

    if (gameMode === 'survival' || gameMode === 'infinite') {
      // v2.4 Sliding Window + Trap Algorithm
      const { BASE_LEVEL_DIVIDER, MAIN_STREAM_DELTA, TRAP_PROBABILITY, TRAP_DELTA_MIN } =
        SURVIVAL_CONFIG.SLIDING_WINDOW_CONFIG;

      const baseLevel = Math.floor(totalQuestions / BASE_LEVEL_DIVIDER) + 1;
      const isTrap = Math.random() < TRAP_PROBABILITY && baseLevel > TRAP_DELTA_MIN;

      let categoryMax = 30;
      switch (targetCategory) {
        case '기초':
          categoryMax = 30;
          break;
        case '논리':
          categoryMax = 15;
          break;
        case '대수':
          categoryMax = 20;
          break;
        case '심화':
          categoryMax = 15;
          break;
      }

      // v2.4 Note: Theoretically baseLevel can grow infinitely.
      // We still scale it to the category's actual max level for generation.
      const scaleFactor = (categoryMax - 1) / 9; // 1->1, 10->categoryMax 기준 비율

      if (isTrap) {
        // [20% 확률] 스피드 함정: 1 ~ (기준 레벨 - 3)
        const trapMax = baseLevel - TRAP_DELTA_MIN;
        const scaledTrapMax = Math.min(categoryMax, Math.ceil((trapMax - 1) * scaleFactor) + 1);
        targetLevel = Math.floor(Math.random() * scaledTrapMax) + 1;
      } else {
        // [80% 확률] 메인 스트림: 기준 레벨 ± 2
        const minWindow = Math.max(1, baseLevel - MAIN_STREAM_DELTA);
        const maxWindow = baseLevel + MAIN_STREAM_DELTA;

        // v2.4 Capping: Ensure scaled ranges remain within [1, categoryMax] and valid
        const scaledMax = Math.min(categoryMax, Math.ceil((maxWindow - 1) * scaleFactor) + 1);
        const scaledMin = Math.min(
          scaledMax,
          Math.max(1, Math.floor((minWindow - 1) * scaleFactor) + 1)
        );

        targetLevel = Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin;
      }
    }

    if (!targetWorld || !targetCategory) {
      console.warn('Missing world or category for question generation');
      return;
    }

    setQuestionAnimation('fade-out');
    setTimeout(() => {
      try {
        const newQuestion = generateQuestion(targetWorld, targetCategory, targetLevel, difficulty);

        if (newQuestion) {
          const questionId = crypto.randomUUID();
          setCurrentQuestion(newQuestion);
          if (onQuestionGenerated) {
            onQuestionGenerated(newQuestion, questionId);
          }
        }
      } catch (e) {
        console.error('Failed to generate question:', e);
        const fallbackQuestion = generateQuestion('World1', '기초', 1, difficulty);
        setCurrentQuestion(fallbackQuestion);
      }

      setAnswerInput('');
      setDisplayValue('');
      setIsError(false);
      setShowFlash(false);
      setQuestionAnimation('fade-in');

      if (gameMode === 'survival' || gameMode === 'infinite') {
        setQuestionKey((prev) => prev + 1);
        setQuestionStartTime(Date.now());
      }

      if (useSystemKeyboard && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      }
    }, 150);
  }, [
    category,
    world,
    difficulty,
    gameMode,
    worldParam,
    categoryParam,
    levelParam,
    useSystemKeyboard,
    inputRef,
    setCurrentQuestion,
    setAnswerInput,
    setDisplayValue,
    setIsError,
    setShowFlash,
    setQuestionAnimation,
    setQuestionKey,
    setQuestionStartTime,
    onQuestionGenerated,
    totalQuestions,
  ]);

  return {
    generateNewQuestion,
  };
}
