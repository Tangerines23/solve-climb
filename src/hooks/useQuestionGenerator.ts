// 문제 생성 로직을 관리하는 커스텀 훅
import { useCallback, useMemo } from 'react';
import { Category, Topic, QuizQuestion, Difficulty, GameMode, World } from '../types/quiz';
import { generateProblem } from '../utils/MathProblemGenerator';
import { generateQuestion } from '../utils/quizGenerator';
import { generateEquation } from '../utils/EquationProblemGenerator';
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
    console.log('generateNewQuestion params:', { worldParam, categoryParam, levelParam });

    if (worldParam && categoryParam) {
      const level = gameMode === 'survival' ? effectiveLevel : (levelParam || 1);

      setQuestionAnimation('fade-out');
      setTimeout(() => {
        try {
          let newQuestion: QuizQuestion | null = null;

          // World 1 매핑 로직
          if (worldParam === 'World1') {
            if (categoryParam === '기초') {
              // 사칙연산
              const problem = generateProblem(level);
              newQuestion = {
                question: problem.expression,
                answer: problem.answer,
              };
            } else if (categoryParam === '대수') {
              // 방정식
              const equation = generateEquation(level);
              newQuestion = {
                question: equation.question,
                answer: equation.x,
              };
            } else {
              // 논리, 심화 등 -> 기존 생성기 사용 (Topic 형식: World-Category)
              const topic = `${worldParam}-${categoryParam}` as Topic;
              newQuestion = generateQuestion(categoryParam as Category, topic, difficulty);
            }
          } else {
            // 다른 월드 추후 구현 (기본적으로 덧셈 폴백)
            const topic = `World1-기초` as Topic;
            newQuestion = generateQuestion('기초', topic, difficulty);
          }

          if (newQuestion) {
            const questionId = crypto.randomUUID();
            setCurrentQuestion(newQuestion);
            if (onQuestionGenerated) {
              onQuestionGenerated(newQuestion, questionId);
            }
          }
        } catch (e) {
          console.error('Failed to generate question:', e);
          const fallbackTopic = `World1-기초` as Topic;
          const fallbackQuestion = generateQuestion('기초', fallbackTopic, difficulty);
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
      return;
    }

    // 파라미터가 없는 경우 스토어 값 사용
    if (!category || !world) return;

    setQuestionAnimation('fade-out');
    setTimeout(() => {
      const topic = `${world}-${category}` as Topic;
      const newQuestion = generateQuestion(category, topic, difficulty);
      const questionId = crypto.randomUUID();
      setCurrentQuestion(newQuestion);
      if (onQuestionGenerated) {
        onQuestionGenerated(newQuestion, questionId);
      }
      setAnswerInput('');
      setDisplayValue('');
      setIsError(false);
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
