import { useCallback } from 'react';
import { QuizQuestion } from '../types/quiz';
import { normalizeRomaji } from '@/utils/japanese';
import { MAX_POSSIBLE_ANSWER } from '@/constants/game';
import { CATEGORY_IDS, MATH_SUB_IDS, SUB_CATEGORY_IDS } from '@/constants/ui';

/**
 * 분수 문자열을 숫자로 변환 (예: "3/4" -> 0.75)
 */
function parseFraction(val: string): number | null {
  const parts = val.trim().split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }
  return null;
}

/**
 * 좌표 문자열을 정규화 (예: "(2, 3)" -> "2,3")
 */
function normalizeCoordinate(val: string): string {
  return val.replace(/[()\s]/g, '');
}

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
    ): boolean | null => {
      if (!answerInput || !currentQuestion) return null;
      const trimmedInput = answerInput.trim();
      const rawAnswer = currentQuestion.answer;
      const rawAnswerStr = String(rawAnswer).trim();

      const isJapaneseQuiz =
        categoryParam === CATEGORY_IDS.LANGUAGE && subParam === SUB_CATEGORY_IDS.JAPANESE;
      const isEquationQuiz =
        categoryParam === CATEGORY_IDS.MATH && subParam === MATH_SUB_IDS.EQUATIONS;
      const isCalculusQuiz =
        categoryParam === CATEGORY_IDS.MATH && subParam === MATH_SUB_IDS.CALCULUS;
      const allowNegative = isEquationQuiz || isCalculusQuiz || rawAnswerStr.startsWith('-');

      // 1. 일본어 퀴즈
      if (isJapaneseQuiz) {
        const normalizedInput = normalizeRomaji(trimmedInput);
        const normalizedAnswer = normalizeRomaji(rawAnswerStr);
        return normalizedInput === normalizedAnswer;
      }

      // 2. 좌표 (Coordinate) 퀴즈
      if (currentQuestion.inputType === 'coordinate' || rawAnswerStr.includes(',')) {
        const normInput = normalizeCoordinate(trimmedInput);
        const normAns = normalizeCoordinate(rawAnswerStr);
        if (!normInput.includes(',')) return null;
        return normInput === normAns;
      }

      // 3. 분수 (Fraction) 퀴즈
      if (
        currentQuestion.inputType === 'fraction' ||
        rawAnswerStr.includes('/') ||
        trimmedInput.includes('/')
      ) {
        // 문자열 단순 매칭 (예: "1/2" === "1/2")
        if (trimmedInput === rawAnswerStr) return true;

        const inputVal = parseFraction(trimmedInput) ?? parseFloat(trimmedInput);
        const ansVal = parseFraction(rawAnswerStr) ?? parseFloat(rawAnswerStr);

        if (isNaN(inputVal) || isNaN(ansVal)) return null;
        return Math.abs(inputVal - ansVal) < 0.0001;
      }

      // 4. 소수 (Decimal) 퀴즈
      if (
        currentQuestion.inputType === 'decimal' ||
        rawAnswerStr.includes('.') ||
        trimmedInput.includes('.')
      ) {
        const inputNum = parseFloat(trimmedInput);
        const ansNum = parseFloat(rawAnswerStr);

        if (isNaN(inputNum)) return null;
        const minValue = allowNegative ? -MAX_POSSIBLE_ANSWER : 0;
        if (inputNum < minValue || inputNum > MAX_POSSIBLE_ANSWER) return null;

        return Math.abs(inputNum - ansNum) < 0.0001;
      }

      // 5. 문자열 정확 일치 (CS 2진수 등 앞자리 0이 중요한 경우, e.g. "011")
      if (typeof rawAnswer === 'string' && isNaN(Number(rawAnswerStr))) {
        return trimmedInput.toUpperCase() === rawAnswerStr.toUpperCase();
      }

      // 6. 일반 수치/정수 퀴즈
      const inputNum = parseFloat(trimmedInput);
      const ansNum = typeof rawAnswer === 'number' ? rawAnswer : parseFloat(rawAnswerStr);

      const minValue = allowNegative ? -MAX_POSSIBLE_ANSWER : 0;

      if (isNaN(inputNum) || inputNum < minValue || inputNum > MAX_POSSIBLE_ANSWER) {
        return null; // 입력 형식 오류 (shake 애니메이션 트리거용)
      }

      return inputNum === ansNum;
    },
    []
  );

  return { validateAnswer };
}
