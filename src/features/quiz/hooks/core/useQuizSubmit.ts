// 답안 제출 로직을 관리하는 커스텀 훅
import { useCallback, FormEvent } from 'react';
import { QuizQuestion, GameMode, Category, World } from '../../types/quiz';
import { useGameStore } from '@/features/quiz/stores/useGameStore';
import { useQuizValidator } from './useQuizValidator';
import { useQuizScoring } from './useQuizScoring';
import { quizEventBus } from '@/lib/eventBus';

interface UseQuizSubmitParams {
  answerInput: string;
  isSubmitting: boolean;
  currentQuestion: QuizQuestion | null;
  categoryParam: string | null;
  subParam: string | null;
  gameMode: GameMode;
  questionStartTime: number | null;
  currentQuestionId?: string | null;
}

export function useQuizSubmit({
  answerInput,
  isSubmitting,
  currentQuestion,
  categoryParam,
  subParam,
  gameMode,
  questionStartTime,
  currentQuestionId,
}: UseQuizSubmitParams) {
  const { isExhausted, feverLevel, combo } = useGameStore();

  const { validateAnswer } = useQuizValidator();
  const { calculateScore } = useQuizScoring();

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (isSubmitting || !currentQuestion) return;
      if (!answerInput || answerInput.trim() === '') return;

      quizEventBus.emit('QUIZ:SUBMISSION_STARTED');

      // 1. Answer Validation
      const validationResult = validateAnswer(
        answerInput,
        currentQuestion,
        categoryParam,
        subParam
      );

      if (validationResult === null) {
        // Invalid input format (e.g. out of range)
        quizEventBus.emit('QUIZ:INVALID_INPUT', { answer: answerInput });
        return;
      }

      const isCorrect = validationResult;
      const currentLevel =
        currentQuestion.level ||
        parseInt(new URLSearchParams(window.location.search).get('level') || '1', 10);

      const earnedDistance = calculateScore(
        currentLevel,
        categoryParam,
        subParam,
        gameMode,
        feverLevel,
        isExhausted
      );

      const solveTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 0;

      // 2. Emit Answer Submitted Event
      // 이 이벤트가 모든 후속 처리(점수 계산, 애니메이션, 피드백, 다음 문제 요청 등)를 트리거합니다.
      quizEventBus.emit('QUIZ:ANSWER_SUBMITTED', {
        questionId: currentQuestionId || '',
        category: (categoryParam as Category) || '기초',
        world: (subParam as World) || 'World1',
        isCorrect,
        answer: answerInput,
        score: earnedDistance,
        combo: isCorrect ? combo + 1 : 0,
        timestamp: Date.now(),
        solveTime, // solveTime도 함께 보냄
      });

      // Note: setIsSubmitting(false)는 애니메이션이나 다음 문제 전환 후
      // QuizContext의 리스너에서 처리될 수 있도록 하거나,
      // 혹은 여기서 일정 시간 후 해제합니다.
      // 여기서는 하위 호환성을 위해 리스너가 호출될 때까지 대기하도록 하거나
      // 명시적으로 "전환" 이벤트가 발생할 때 해제하도록 설계합니다.
    },
    [
      answerInput,
      isSubmitting,
      currentQuestion,
      categoryParam,
      subParam,
      gameMode,
      questionStartTime,
      currentQuestionId,
      feverLevel,
      isExhausted,
      combo,
      validateAnswer,
      calculateScore,
    ]
  );

  return {
    handleSubmit,
  };
}
