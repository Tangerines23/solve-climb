// 답안 제출 로직을 관리하는 커스텀 훅
import { useCallback, useRef, useEffect, FormEvent } from 'react';
import { QuizQuestion } from '../types/quiz';
import { GameMode } from '../types/quiz';
import { CLIMB_PER_CORRECT, SLIDE_PER_WRONG, MAX_POSSIBLE_ANSWER } from '../constants/game';
import { normalizeRomaji } from '../utils/japanese';
import { vibrateMedium, vibrateLong } from '../utils/haptic';
import { useGameStore } from '../stores/useGameStore';
import { useUserStore } from '../stores/useUserStore';
import { supabase } from '../utils/supabaseClient';

interface UseQuizSubmitParams {
  answerInput: string;
  isSubmitting: boolean;
  currentQuestion: QuizQuestion | null;
  categoryParam: string | null;
  subParam: string | null;
  gameMode: GameMode;
  questionStartTime: number | null;
  hapticEnabled: boolean;
  useSystemKeyboard: boolean;
  setIsSubmitting: (value: boolean) => void;
  setCardAnimation: (value: string) => void;
  setInputAnimation: (value: string) => void;
  setDisplayValue: (value: string) => void;
  setIsError: (value: boolean) => void;
  setShowFlash: (value: boolean) => void;
  setShowSlideToast: (value: boolean) => void;
  setDamagePosition: (value: { left: string; top: string }) => void;
  setAnswerInput: (value: string) => void;
  increaseScore: (amount: number) => void;
  decreaseScore: (amount: number) => void;
  generateNewQuestion: () => void;
  handleGameOver: () => void;
  setTotalQuestions: (updater: (prev: number) => number) => void;
  setWrongAnswers: (updater: (prev: Array<{ question: string; wrongAnswer: string; correctAnswer: string }>) => Array<{ question: string; wrongAnswer: string; correctAnswer: string }>) => void;
  setSolveTimes: (updater: (prev: number[]) => number[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showFeedback: (text: string, subText?: string, type?: 'success' | 'info') => void;
}

export function useQuizSubmit({
  answerInput,
  isSubmitting,
  currentQuestion,
  categoryParam,
  subParam,
  gameMode,
  questionStartTime,
  hapticEnabled,
  useSystemKeyboard,
  setIsSubmitting,
  setCardAnimation,
  setInputAnimation,
  setDisplayValue,
  setIsError,
  setShowFlash,
  setShowSlideToast,
  setDamagePosition,
  setAnswerInput,
  increaseScore,
  decreaseScore,
  generateNewQuestion,
  handleGameOver,
  setTotalQuestions,
  setWrongAnswers,
  setSolveTimes,
  inputRef,
  showFeedback,
}: UseQuizSubmitParams) {
  const { incrementCombo, resetCombo, isExhausted, activeItems, consumeActiveItem } = useGameStore();
  const { stamina, fetchUserData } = useUserStore();

  // 함수 참조를 안정적으로 유지하기 위한 ref
  const paramsRef = useRef({
    generateNewQuestion,
    handleGameOver,
    setTotalQuestions,
    setWrongAnswers,
    setSolveTimes,
  });

  useEffect(() => {
    paramsRef.current = {
      generateNewQuestion,
      handleGameOver,
      setTotalQuestions,
      setWrongAnswers,
      setSolveTimes,
    };
  }, [generateNewQuestion, handleGameOver, setTotalQuestions, setWrongAnswers, setSolveTimes]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting || !currentQuestion) return;

      // 값이 비어있으면 무시
      if (!answerInput || answerInput.trim() === '') return;

      setIsSubmitting(true);

      // 일본어 퀴즈인지 확인 (category가 '언어'이고 subParam이 'japanese'인 경우)
      const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
      // 방정식/미적분 문제인지 확인 (음수 답도 허용)
      const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
      const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
      const allowNegative = isEquationQuiz || isCalculusQuiz;

      let isCorrect = false;

      if (isJapaneseQuiz) {
        // 일본어 퀴즈: 문자열 답안 비교 (대소문자, 공백 무시)
        const normalizedInput = normalizeRomaji(answerInput);
        const normalizedAnswer = normalizeRomaji(String(currentQuestion.answer));
        isCorrect = normalizedInput === normalizedAnswer;
      } else {
        // 수학 문제: 숫자 답안 비교
        const answer = parseInt(answerInput, 10);
        // 방정식/미적분 문제는 음수도 허용, 일반 수학 문제는 0 이상만 허용
        const minValue = allowNegative ? -999 : 0;
        if (isNaN(answer) || answer < minValue || answer > MAX_POSSIBLE_ANSWER) {
          setCardAnimation('wrong-shake');
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => setCardAnimation(''), 150);
          setIsSubmitting(false);
          return;
        }
        isCorrect = typeof currentQuestion.answer === 'number'
          ? currentQuestion.answer === answer
          : false;
      }

      // 문제 수 증가
      paramsRef.current.setTotalQuestions(prev => prev + 1);

      if (isCorrect) {
        // 진동 피드백
        if (hapticEnabled) {
          vibrateMedium();
        }
        // 서바이벌 모드: 정답을 맞춘 경우 풀이 시간 기록
        if (gameMode === 'survival' && questionStartTime !== null) {
          const solveTime = (Date.now() - questionStartTime) / 1000; // 초 단위
          paramsRef.current.setSolveTimes(prev => [...prev, solveTime]);
        }

        setCardAnimation('correct-flash');
        setInputAnimation('correct-flash');

        // 콤보 증가 및 가중치 적용
        incrementCombo();
        const baseScore = CLIMB_PER_CORRECT;
        const multiplier = isExhausted ? 0.8 : 1.0;
        increaseScore(Math.floor(baseScore * multiplier));

        setTimeout(() => {
          setDisplayValue('');
          setIsError(false);
          setShowFlash(false);
          paramsRef.current.generateNewQuestion();
          setInputAnimation('');
          setCardAnimation('');
          setIsSubmitting(false);
          // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
          if (useSystemKeyboard && inputRef.current) {
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }
        }, 300);
      } else {
        // 오답 처리: 정답을 빨간색으로 0.8초간 표시
        const correctAnswerText = String(currentQuestion.answer);

        // 1단계: 에러 상태 활성화 및 정답 표시 (동시에 업데이트하여 깜빡임 방지)
        setIsError(true);
        setDisplayValue(correctAnswerText);
        setCardAnimation('wrong-shake');

        const hasSafetyRope = activeItems.includes('safety_rope');
        if (hasSafetyRope) {
          consumeActiveItem('safety_rope');
          // Show special toast or feedback for rope use
          showFeedback('SAFE!', 'Combo Protected');
          console.log('[Game] Safety Rope used! Combo protected.');
        } else {
          resetCombo();
        }

        // 플래시 애니메이션 트리거
        setShowFlash(true);
        setTimeout(() => {
          setShowFlash(false);
        }, 400); // 애니메이션 지속시간과 동일

        // 진동 피드백 (토스 표준 API 사용)
        if (hapticEnabled) {
          vibrateLong(); // 긴 진동 사용
        }

        // 서바이벌 모드: 틀리면 게임 종료 (오답 저장)
        if (gameMode === 'survival') {
          // 오답 정보 저장
          const questionText = currentQuestion.question;
          paramsRef.current.setWrongAnswers(prev => [...prev, {
            question: questionText,
            wrongAnswer: answerInput,
            correctAnswer: correctAnswerText
          }]);

          // 800ms 후 게임 종료 (Flare가 있으면 부활)
          setTimeout(() => {
            const hasFlare = activeItems.includes('flare');
            if (hasFlare) {
              consumeActiveItem('flare');
              showFeedback('REVIVE!', 'Survival Continued', 'info');
              console.log('[Game] Flare used! Revived in survival mode.');
              setIsError(false);
              setDisplayValue('');
              setShowFlash(false);
              paramsRef.current.generateNewQuestion();
              setIsSubmitting(false);
            } else {
              setIsError(false);
              setDisplayValue('');
              setShowFlash(false);
              setInputAnimation('');
              setCardAnimation('');
              paramsRef.current.handleGameOver();
            }
          }, 800);
        } else {
          // 타임어택 모드: 오답 시 감점 적용
          if (!hasSafetyRope) {
            decreaseScore(SLIDE_PER_WRONG);
          }

          // 이전 토스트가 있다면 먼저 제거하고 새로 표시
          setShowSlideToast(false);

          // 랜덤 위치 생성 (X: 10-80%, Y: 10-40%)
          const randomLeft = Math.floor(Math.random() * 70) + 10; // 10% ~ 80%
          const randomTop = Math.floor(Math.random() * 30) + 10;  // 10% ~ 40%
          setDamagePosition({ left: `${randomLeft}%`, top: `${randomTop}%` });

          // 토스트를 즉시 표시 (requestAnimationFrame 제거로 지연 없음)
          setShowSlideToast(true);

          // 토스트 자동 종료 타이머 (700ms - 다음 문제 이동 전에 자연스럽게 사라짐)
          const toastHideTimer = setTimeout(() => {
            setShowSlideToast(false);
          }, 700);

          // 800ms 후 다음 문제로 이동
          setTimeout(() => {
            // 토스트 타이머 정리 (혹시 모를 중복 제거 방지)
            clearTimeout(toastHideTimer);

            setIsError(false);
            setDisplayValue('');
            setAnswerInput('');
            setShowFlash(false);
            setShowSlideToast(false); // 명시적으로 초기화 (이미 사라졌을 수도 있음)
            setInputAnimation('');
            setCardAnimation('');
            paramsRef.current.generateNewQuestion();
            setIsSubmitting(false);
            // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }
          }, 800);
        }
      }
    },
    [
      answerInput,
      isSubmitting,
      currentQuestion,
      categoryParam,
      subParam,
      gameMode,
      questionStartTime,
      hapticEnabled,
      useSystemKeyboard,
      setIsSubmitting,
      setCardAnimation,
      setInputAnimation,
      setDisplayValue,
      setIsError,
      setShowFlash,
      setShowSlideToast,
      setDamagePosition,
      setAnswerInput,
      increaseScore,
      decreaseScore,
      inputRef,
      showFeedback,
    ]
  );

  return {
    handleSubmit,
  };
}

