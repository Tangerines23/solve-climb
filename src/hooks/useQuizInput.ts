// 키보드 입력 처리 로직을 관리하는 커스텀 훅
import { useCallback } from 'react';

interface UseQuizInputParams {
  answerInput: string;
  isSubmitting: boolean;
  isError: boolean;
  categoryParam: string | null;
  subParam: string | null;
  setAnswerInput: (value: string) => void;
  setDisplayValue: (value: string) => void;
}

export function useQuizInput({
  answerInput,
  isSubmitting,
  isError,
  categoryParam,
  subParam,
  setAnswerInput,
  setDisplayValue,
}: UseQuizInputParams) {
  // 수학 퀴즈용 키패드 핸들러 (3x3 그리드)
  const handleKeypadNumber = useCallback((num: string) => {
    if (isSubmitting || isError) return;

    const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
    const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
    const allowNegative = isEquationQuiz || isCalculusQuiz;

    // 음수 기호 처리
    if (num === '-') {
      if (allowNegative) {
        // 이미 음수면 제거, 아니면 추가
        if (answerInput.startsWith('-')) {
          const newValue = answerInput.substring(1);
          setAnswerInput(newValue);
          setDisplayValue(newValue);
        } else {
          const newValue = '-' + answerInput;
          setAnswerInput(newValue);
          setDisplayValue(newValue);
        }
        if (navigator.vibrate) navigator.vibrate(15);
      }
      return;
    }

    // 최대 자리수 제한 (방정식/미적분은 음수 기호 포함 6자리, 일반은 5자리)
    const maxLength = allowNegative ? 6 : 5;
    if (answerInput.length >= maxLength) return;

    // 음수 기호가 있으면 숫자만 추가
    if (answerInput.startsWith('-')) {
      if (answerInput.length >= maxLength) return;
    }

    // 진동 피드백
    if (navigator.vibrate) navigator.vibrate(15);
    setAnswerInput((prev) => {
      const newValue = prev + num;
      setDisplayValue(newValue);
      return newValue;
    });
  }, [isSubmitting, categoryParam, subParam, answerInput, isError, setAnswerInput, setDisplayValue]);

  // 쿼티 키보드 핸들러 (일본어 퀴즈 및 수학 퀴즈 모두 지원)
  const handleQwertyKeyPress = useCallback((key: string) => {
    if (isSubmitting || isError) return;

    const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
    const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
    const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
    const allowNegative = isEquationQuiz || isCalculusQuiz;

    // 일본어 퀴즈: 영문자만 허용
    if (isJapaneseQuiz) {
      if (/[a-z]/.test(key)) {
        if (answerInput.length >= 10) return;
        setAnswerInput((prev) => {
          const newValue = prev + key;
          setDisplayValue(newValue);
          return newValue;
        });
      }
      return;
    }

    // 수학 퀴즈: 숫자 및 음수 기호 처리
    if (key === '-') {
      if (allowNegative) {
        // 이미 음수면 제거, 아니면 추가
        if (answerInput.startsWith('-')) {
          const newValue = answerInput.substring(1);
          setAnswerInput(newValue);
          setDisplayValue(newValue);
        } else {
          const newValue = '-' + answerInput;
          setAnswerInput(newValue);
          setDisplayValue(newValue);
        }
        if (navigator.vibrate) navigator.vibrate(15);
      }
      return;
    }

    // 숫자 처리
    if (/[0-9]/.test(key)) {
      const maxLength = allowNegative ? 6 : 5;
      if (answerInput.length >= maxLength) return;

      // 음수 기호가 있으면 숫자만 추가
      if (answerInput.startsWith('-')) {
        if (answerInput.length >= maxLength) return;
      }

      // 진동 피드백
      if (navigator.vibrate) navigator.vibrate(15);
      setAnswerInput((prev) => {
        const newValue = prev + key;
        setDisplayValue(newValue);
        return newValue;
      });
    }
  }, [isSubmitting, categoryParam, subParam, answerInput, isError, setAnswerInput, setDisplayValue]);

  const handleKeypadClear = useCallback(() => {
    if (isSubmitting || isError) return;
    setAnswerInput('');
    setDisplayValue('');
  }, [isSubmitting, isError, setAnswerInput, setDisplayValue]);

  const handleKeypadBackspace = useCallback(() => {
    if (isSubmitting || isError) return;
    setAnswerInput((prev) => prev.slice(0, -1));
    setDisplayValue('');
  }, [isSubmitting, isError, setAnswerInput, setDisplayValue]);

  return {
    handleKeypadNumber,
    handleQwertyKeyPress,
    handleKeypadClear,
    handleKeypadBackspace,
  };
}

