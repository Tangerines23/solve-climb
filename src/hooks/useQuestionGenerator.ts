// 문제 생성 로직을 관리하는 커스텀 훅
import { useCallback, useMemo } from 'react';
import { Category, QuizQuestion, Difficulty, GameMode, World } from '../types/quiz';
import { generateQuestion } from '../utils/quizGenerator';
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
  const effectiveLevel = useMemo(() => {
    if (gameMode !== 'survival') return levelParam || 1;

    const currentWave = totalQuestions + 1;
    const waveConfig = SURVIVAL_CONFIG.WAVES.find(
      (w) => currentWave >= w.start && currentWave <= w.end
    );
    return waveConfig ? waveConfig.level : 15;
  }, [gameMode, levelParam, totalQuestions]);

  const generateNewQuestion = useCallback(() => {
    // 1. 월드/카테고리/레벨 결정 (파라미터 우선, 없으면 스토어 값 사용)
    const targetWorld = (worldParam || world) as World;
    const targetCategory = (categoryParam || category) as Category;
    const targetLevel = gameMode === 'survival' ? effectiveLevel : (levelParam || 1);

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

      if (gameMode === 'survival') {
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
