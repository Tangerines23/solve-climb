// 문제 생성 로직을 관리하는 커스텀 훅
import { useCallback } from 'react';
import { Category, Topic, QuizQuestion, Difficulty, GameMode } from '../types/quiz';
import { generateProblem } from '../utils/MathProblemGenerator';
import { generateQuestion } from '../utils/quizGenerator';
import { generateEquation } from '../utils/EquationProblemGenerator';
import { APP_CONFIG } from '../config/app';

interface UseQuestionGeneratorParams {
  category: Category | null;
  topic: Topic | null;
  difficulty: Difficulty;
  gameMode: GameMode;
  categoryParam: string | null;
  subParam: string | null;
  levelParam: number | null;
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
  setIsError,
  setShowFlash,
  setQuestionAnimation,
  setQuestionKey,
  setQuestionStartTime,
  onQuestionGenerated,
}: UseQuestionGeneratorParams) {
  const generateNewQuestion = useCallback(() => {
    // URL 파라미터가 있으면 직접 사용, 없으면 store에서 가져오기
    let currentCategory = category;
    let currentTopic = topic;

    console.log('generateNewQuestion params:', { categoryParam, subParam, levelParam });

    if (categoryParam && subParam) {
      const categoryName =
        APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
      if (categoryName) {
        currentCategory = categoryName as Category;

        // 레벨에 따라 적절한 topic 매핑 (arithmetic 서브토픽의 경우)
        if (subParam === 'arithmetic' && levelParam !== null) {
          console.log('Entering arithmetic block');
          const level = levelParam;

          setQuestionAnimation('fade-out');
          setTimeout(() => {
            try {
              console.log('Calling generateProblem with level:', level);
              // 새로운 MathProblemGenerator 사용
              const problem = generateProblem(level);
              console.log('Generated problem:', problem);
              const newQuestion: QuizQuestion = {
                question: problem.expression,
                answer: problem.answer,
              };
              // 문제 ID 생성 (UUID)
              const questionId = crypto.randomUUID();
              setCurrentQuestion(newQuestion);
              // 문제 생성 콜백 호출
              if (onQuestionGenerated) {
                onQuestionGenerated(newQuestion, questionId);
              }
            } catch (e) {
              console.error('Failed to generate problem, falling back to legacy generator', e);
              // 실패 시 기존 로직으로 폴백
              const topicMap: Record<number, '덧셈' | '뺄셈' | '곱셈' | '나눗셈'> = {
                1: '덧셈',
                2: '뺄셈',
                3: '덧셈',
                4: '뺄셈',
                5: '곱셈',
                6: '나눗셈',
                7: '덧셈',
                8: '곱셈',
                9: '나눗셈',
                10: '덧셈',
              };
              const fallbackTopic = topicMap[level] || '덧셈';
              const safeCategory = currentCategory || '수학';
              const newQuestion = generateQuestion(safeCategory, fallbackTopic, difficulty);
              // 문제 ID 생성 (UUID)
              const questionId = crypto.randomUUID();
              setCurrentQuestion(newQuestion);
              // 문제 생성 콜백 호출
              if (onQuestionGenerated) {
                onQuestionGenerated(newQuestion, questionId);
              }
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
          return; // 여기서 함수 종료
        } else if (subParam === 'equations' && levelParam !== null) {
          // 방정식 서브토픽 - EquationProblemGenerator 사용
          const level = levelParam;

          setQuestionAnimation('fade-out');
          setTimeout(() => {
            try {
              console.log('Calling generateEquation with level:', level);
              // EquationProblemGenerator 사용
              const equation = generateEquation(level);
              console.log('Generated equation:', equation);
              const newQuestion: QuizQuestion = {
                question: equation.question,
                answer: equation.x,
              };
              // 문제 ID 생성 (UUID)
              const questionId = crypto.randomUUID();
              setCurrentQuestion(newQuestion);
              // 문제 생성 콜백 호출
              if (onQuestionGenerated) {
                onQuestionGenerated(newQuestion, questionId);
              }
            } catch (e) {
              console.error('Failed to generate equation, falling back to legacy generator', e);
              // 실패 시 기존 로직으로 폴백
              currentTopic = 'equations' as Topic;
              const safeCategory = currentCategory || '수학';
              const newQuestion = generateQuestion(safeCategory, currentTopic, difficulty);
              // 문제 ID 생성 (UUID)
              const questionId = crypto.randomUUID();
              setCurrentQuestion(newQuestion);
              // 문제 생성 콜백 호출
              if (onQuestionGenerated) {
                onQuestionGenerated(newQuestion, questionId);
              }
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
          return; // 여기서 함수 종료
        } else if (subParam === 'equations') {
          // 방정식 서브토픽 (레벨 파라미터 없을 때)
          currentTopic = 'equations' as Topic;
        } else if (subParam === 'calculus') {
          // 미적분 서브토픽
          currentTopic = 'calculus' as Topic;
        } else {
          // 다른 서브토픽은 subParam을 그대로 사용
          currentTopic = subParam as Topic;
        }
      }
    }

    if (!currentCategory || !currentTopic) return;

    setQuestionAnimation('fade-out');
    setTimeout(() => {
      const newQuestion = generateQuestion(currentCategory, currentTopic as Topic, difficulty);
      // 문제 ID 생성 (UUID)
      const questionId = crypto.randomUUID();
      setCurrentQuestion(newQuestion);
      // 문제 생성 콜백 호출
      if (onQuestionGenerated) {
        onQuestionGenerated(newQuestion, questionId);
      }
      setAnswerInput('');
      setDisplayValue('');
      setIsError(false);
      setQuestionAnimation('fade-in');

      // 서바이벌 모드: 문제가 바뀔 때마다 타이머 리셋 (key 변경으로 TimerCircle 리마운트)
      if (gameMode === 'survival') {
        setQuestionKey((prev) => prev + 1);
        // 서바이벌 모드: 문제 시작 시간 기록
        setQuestionStartTime(Date.now());
      }

      // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
      if (useSystemKeyboard && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      }
    }, 150);
  }, [
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
    setIsError,
    setShowFlash,
    setQuestionAnimation,
    setQuestionKey,
    setQuestionStartTime,
    onQuestionGenerated,
  ]);

  return {
    generateNewQuestion,
  };
}
