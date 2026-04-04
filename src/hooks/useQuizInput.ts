// 키보드 입력 처리 로직을 관리하는 커스텀 훅
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface UseQuizInputParams {
  isSubmitting: boolean;
  isError: boolean;
  isPaused?: boolean;
  categoryParam: string | null;
  subParam: string | null;
  setAnswerInput: Dispatch<SetStateAction<string>>;
  setDisplayValue: Dispatch<SetStateAction<string>>;
  onInputStart?: () => void; // 입력 시작 시 호출 (구조 신호탄 타이머 재개용)
}

export function useQuizInput({
  isSubmitting,
  isError,
  isPaused = false,
  categoryParam,
  subParam,
  setAnswerInput,
  setDisplayValue,
  onInputStart,
}: UseQuizInputParams) {
  // 수학 퀴즈용 키패드 핸들러 (3x3 그리드)
  const handleKeypadNumber = useCallback(
    (num: string) => {
      if (isSubmitting || isError || isPaused) return;
      if (onInputStart) onInputStart();

      const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
      const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
      const allowNegative = isEquationQuiz || isCalculusQuiz;

      if (num === '-') {
        if (allowNegative) {
          setAnswerInput((prev) => {
            const newValue = prev.startsWith('-') ? prev.substring(1) : '-' + prev;
            setDisplayValue(newValue);
            return newValue;
          });
          if (navigator.vibrate) navigator.vibrate(15);
        }
        return;
      }

      const maxLength = allowNegative ? 6 : 5;

      if (navigator.vibrate) navigator.vibrate(15);
      setAnswerInput((prev) => {
        if (prev.length >= maxLength) return prev;
        const newValue = prev + num;
        setDisplayValue(newValue);
        return newValue;
      });
    },
    [
      isSubmitting,
      categoryParam,
      subParam,
      isError,
      isPaused,
      onInputStart,
      setAnswerInput,
      setDisplayValue,
    ]
  );

  // 쿼티 키보드 핸들러 (일본어 퀴즈 및 수학 퀴즈 모두 지원)
  const handleQwertyKeyPress = useCallback(
    (key: string) => {
      if (isSubmitting || isError || isPaused) return;
      if (onInputStart) onInputStart();

      const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
      const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
      const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
      const allowNegative = isEquationQuiz || isCalculusQuiz;

      if (isJapaneseQuiz) {
        if (/[a-z]/.test(key)) {
          setAnswerInput((prev) => {
            if (prev.length >= 10) return prev;
            const newValue = prev + key;
            setDisplayValue(newValue);
            return newValue;
          });
        }
        return;
      }

      if (key === '-') {
        if (allowNegative) {
          setAnswerInput((prev) => {
            const newValue = prev.startsWith('-') ? prev.substring(1) : '-' + prev;
            setDisplayValue(newValue);
            return newValue;
          });
          if (navigator.vibrate) navigator.vibrate(15);
        }
        return;
      }

      if (/[0-9]/.test(key)) {
        const maxLength = allowNegative ? 6 : 5;
        if (navigator.vibrate) navigator.vibrate(15);
        setAnswerInput((prev) => {
          if (prev.length >= maxLength) return prev;
          const newValue = prev + key;
          setDisplayValue(newValue);
          return newValue;
        });
      }
    },
    [
      isSubmitting,
      categoryParam,
      subParam,
      isError,
      isPaused,
      onInputStart,
      setAnswerInput,
      setDisplayValue,
    ]
  );

  const handleKeypadClear = useCallback(() => {
    if (isSubmitting || isError || isPaused) return;
    setAnswerInput('');
    setDisplayValue('');
  }, [isSubmitting, isError, isPaused, setAnswerInput, setDisplayValue]);

  const handleKeypadBackspace = useCallback(() => {
    if (isSubmitting || isError || isPaused) return;
    setAnswerInput((prev) => prev.slice(0, -1));
    setDisplayValue('');
  }, [isSubmitting, isError, isPaused, setAnswerInput, setDisplayValue]);

  return {
    handleKeypadNumber,
    handleQwertyKeyPress,
    handleKeypadClear,
    handleKeypadBackspace,
  };
}
