// 문제 생성 로직을 관리하는 커스텀 훅
import { useCallback, useMemo } from 'react';
import { Category, QuizQuestion, Difficulty, GameMode, World } from '../types/quiz';
import { generateQuestion } from '../utils/quizGenerator';
import { SURVIVAL_CONFIG } from '../constants/game';
import { useBaseCampStore } from '../stores/useBaseCampStore';
import { useDeathNoteStore } from '../stores/useDeathNoteStore';

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
  const effectiveLevel = useMemo(() => {
    if (gameMode === 'infinite') {
      const targetCategory = (categoryParam || category) as Category;
      switch (targetCategory) {
        case '기초': return Math.floor(Math.random() * 30) + 1;
        case '논리': return Math.floor(Math.random() * 15) + 1;
        case '대수': return Math.floor(Math.random() * 20) + 1;
        case '심화': return Math.floor(Math.random() * 15) + 1;
        default: return Math.floor(Math.random() * 10) + 1;
      }
    }

    if (gameMode !== 'survival') return levelParam || 1;

    const currentWave = totalQuestions + 1;
    const waveConfig = SURVIVAL_CONFIG.WAVES.find(
      (w) => currentWave >= w.start && currentWave <= w.end
    );

    // v2.2 상세 기획 반영: Phase별 레벨 범위 내에서 무작위 선택
    if (waveConfig) {
      const { minLevel, maxLevel } = waveConfig;
      // 해당 범위(min-max) 내에서 무작위 레벨 선택
      return Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
    }

    return 10; // Fallback
  }, [gameMode, levelParam, totalQuestions]);

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
    const targetLevel = (gameMode === 'survival' || gameMode === 'infinite') ? effectiveLevel : levelParam || 1;

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
    effectiveLevel,
  ]);

  return {
    generateNewQuestion,
  };
}
