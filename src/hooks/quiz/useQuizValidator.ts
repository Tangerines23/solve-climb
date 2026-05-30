import { useCallback } from 'react';
import { QuizQuestion } from '../../types/quiz';
import { normalizeRomaji } from '../../utils/japanese';
import { MAX_POSSIBLE_ANSWER } from '../../constants/game';
import { CATEGORY_IDS, MATH_SUB_IDS, SUB_CATEGORY_IDS } from '../../constants/ui';

/**
 * 퀴즈 정답 유효성 검사를 담당하는 훅
 */
export function useQuizValidator() {
  const validateAnswer = useCallback(
    (
      answerInput: string,
      currentQuestion: QuizQuestion,
      categoryParam: string | null,
      subParam: string | null
    ) => {
      const isJapaneseQuiz =
        categoryParam === CATEGORY_IDS.LANGUAGE && subParam === SUB_CATEGORY_IDS.JAPANESE;
      const isEquationQuiz =
        categoryParam === CATEGORY_IDS.MATH && subParam === MATH_SUB_IDS.EQUATIONS;
      const isCalculusQuiz =
        categoryParam === CATEGORY_IDS.MATH && subParam === MATH_SUB_IDS.CALCULUS;
      const allowNegative = isEquationQuiz || isCalculusQuiz;

      if (isJapaneseQuiz) {
        const normalizedInput = normalizeRomaji(answerInput);
        const normalizedAnswer = normalizeRomaji(String(currentQuestion.answer));
        return normalizedInput === normalizedAnswer;
      }

      const answer = parseInt(answerInput, 10);
      const minValue = allowNegative ? -999 : 0;

      if (isNaN(answer) || answer < minValue || answer > MAX_POSSIBLE_ANSWER) {
        return null; // 입력 형식 오류 (shake 애니메이션 트리거용)
      }

      const isCorrect = Number(currentQuestion.answer) === answer;

      return isCorrect;
    },
    []
  );

  return { validateAnswer };
}
