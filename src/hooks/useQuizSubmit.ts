// 답안 제출 로직을 관리하는 커스텀 훅
import { useCallback, useRef, useEffect, FormEvent } from 'react';
import { QuizQuestion, GameMode, World, Category } from '../types/quiz';
import { SLIDE_PER_WRONG } from '../constants/game';
import { useGameStore } from '../stores/useGameStore';
import { useBaseCampStore } from '../stores/useBaseCampStore';
import { useDeathNoteStore } from '../stores/useDeathNoteStore';
import { analytics } from '@/services/analytics';
import { useQuizValidator } from './quiz/useQuizValidator';
import { useQuizScoring } from './quiz/useQuizScoring';
import { useQuizFeedback } from './quiz/useQuizFeedback';
import { GAME_MODES } from '../constants/ui';

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
  setToastValue: (value: string) => void;
  setDamagePosition: (value: { left: string; top: string }) => void;
  setAnswerInput: (value: string) => void;
  increaseScore: (amount: number) => void;
  decreaseScore: (amount: number) => void;
  generateNewQuestion: () => void;
  handleGameOver: () => void;
  setTotalQuestions: (updater: (prev: number) => number) => void;
  setWrongAnswers: (
    updater: (
      prev: Array<{ question: string; wrongAnswer: string; correctAnswer: string }>
    ) => Array<{ question: string; wrongAnswer: string; correctAnswer: string }>
  ) => void;
  setSolveTimes: (updater: (prev: number[]) => number[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showFeedback: (text: string, subText?: string, type?: 'success' | 'info') => void;
  onSafetyRopeUsed?: () => void;
  setIsFlarePaused?: (paused: boolean) => void;
  onAnswerSubmitted?: (questionId: string, userAnswer: number) => void;
  onPenalty?: (amount: number) => void;
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
  hapticEnabled,
  useSystemKeyboard,
  setIsSubmitting,
  setCardAnimation,
  setInputAnimation,
  setDisplayValue,
  setIsError,
  setShowFlash,
  setShowSlideToast,
  setToastValue,
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
  onSafetyRopeUsed,
  setIsFlarePaused,
  onAnswerSubmitted,
  currentQuestionId,
  onPenalty,
}: UseQuizSubmitParams) {
  const {
    incrementCombo,
    resetCombo,
    isExhausted,
    activeItems,
    consumeActiveItem,
    lives,
    consumeLife,
  } = useGameStore();

  const { validateAnswer } = useQuizValidator();
  const { calculateScore } = useQuizScoring();
  const { triggerSuccessFeedback, triggerWrongFeedback } = useQuizFeedback();

  // 함수 참조를 안정적으로 유지하기 위한 ref
  const paramsRef = useRef({
    generateNewQuestion,
    handleGameOver,
    setTotalQuestions,
    setWrongAnswers,
    setSolveTimes,
    categoryParam,
    subParam,
    onPenalty,
  });

  useEffect(() => {
    paramsRef.current = {
      generateNewQuestion,
      handleGameOver,
      setTotalQuestions,
      setWrongAnswers,
      setSolveTimes,
      categoryParam,
      subParam,
      onPenalty,
    };
  }, [
    generateNewQuestion,
    handleGameOver,
    setTotalQuestions,
    setWrongAnswers,
    setSolveTimes,
    categoryParam,
    subParam,
    onPenalty,
  ]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting || !currentQuestion) return;
      if (!answerInput || answerInput.trim() === '') return;

      setIsSubmitting(true);

      // 1. Answer Validation
      const validationResult = validateAnswer(
        answerInput,
        currentQuestion,
        categoryParam,
        subParam
      );

      if (validationResult === null) {
        // Invalid input format (e.g. out of range)
        setCardAnimation('wrong-shake');
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => setCardAnimation(''), 150);
        setIsSubmitting(false);
        return;
      }

      const isCorrect = validationResult;

      // 2. Analytics Tracking
      analytics.trackEvent({
        category: 'quiz',
        action: 'submit_answer',
        label: isCorrect ? 'correct' : 'wrong',
        data: {
          category: categoryParam,
          world: subParam,
          isCorrect,
          answer: answerInput,
        },
      });

      // 3. Collect Math Answer
      if (!isCorrect && onAnswerSubmitted && currentQuestionId) {
        // Note: original code only tracked if math question.
        // We'll keep it simple: if onAnswerSubmitted exists and we have ID.
        // Actually original was `onAnswerSubmitted(currentQuestionId, answer)` where answer was parsed int.
        const numericAnswer = parseInt(answerInput, 10);
        if (!isNaN(numericAnswer)) {
          onAnswerSubmitted(currentQuestionId, numericAnswer);
        }
      }

      paramsRef.current.setTotalQuestions((prev) => prev + 1);

      // 4. Base Camp Diagnostic Mode Logic
      const isBaseCamp = new URLSearchParams(window.location.search).get('mode') === 'base-camp';
      if (isBaseCamp) {
        const solveTime = questionStartTime ? Date.now() - questionStartTime : 2000;
        const { submitAnswer, currentQuestionIndex, getRecommendation, setCompleted } =
          useBaseCampStore.getState();

        submitAnswer(isCorrect, solveTime);

        if (currentQuestionIndex >= 9) {
          setCompleted(true);
          const { accuracy, recommendation } = getRecommendation();
          setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            params.set('mode', 'base-camp-result');
            params.set('accuracy', accuracy.toString());
            params.set('recommendation', recommendation);
            window.location.href = `/result?${params.toString()}`;
          }, 1000);
          return;
        }

        if (isCorrect) {
          setCardAnimation('correct-flash');
          setTimeout(() => {
            paramsRef.current.generateNewQuestion();
            setCardAnimation('');
            setIsSubmitting(false);
          }, 300);
        } else {
          setIsError(true);
          setDisplayValue(String(currentQuestion.answer));
          setCardAnimation('wrong-shake');
          setTimeout(() => {
            setIsError(false);
            setDisplayValue('');
            paramsRef.current.generateNewQuestion();
            setCardAnimation('');
            setIsSubmitting(false);
          }, 800);
        }
        return;
      }

      // 5. Normal Game Logic
      if (isCorrect) {
        // Success Logic
        if (gameMode === GAME_MODES.SURVIVAL && questionStartTime !== null) {
          const solveTime = (Date.now() - questionStartTime) / 1000;
          paramsRef.current.setSolveTimes((prev) => [...prev, solveTime]);
        }

        setCardAnimation('correct-flash');
        setInputAnimation('correct-flash');
        incrementCombo();

        const currentLevel =
          currentQuestion.level ||
          parseInt(new URLSearchParams(window.location.search).get('level') || '1', 10);
        const { feverLevel } = useGameStore.getState();

        const earnedDistance = calculateScore(
          currentLevel,
          categoryParam,
          subParam,
          gameMode,
          feverLevel,
          isExhausted
        );

        triggerSuccessFeedback(
          earnedDistance,
          {
            setToastValue,
            setDamagePosition,
            setShowSlideToast,
            setShowFlash,
          },
          hapticEnabled
        );

        increaseScore(earnedDistance);

        setTimeout(() => {
          setDisplayValue('');
          setIsError(false);
          setShowFlash(false);
          paramsRef.current.generateNewQuestion();
          setInputAnimation('');
          setCardAnimation('');
          setIsSubmitting(false);
          if (useSystemKeyboard && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }, 300);
      } else {
        // Failure Logic
        const correctAnswerText = String(currentQuestion.answer);
        setIsError(true);
        setDisplayValue(correctAnswerText);
        setCardAnimation('wrong-shake');

        const hasSafetyRope = activeItems.includes('safety_rope');
        if (hasSafetyRope) {
          consumeActiveItem('safety_rope');
          if (onSafetyRopeUsed) onSafetyRopeUsed();

          setTimeout(() => {
            setIsError(false);
            setDisplayValue('');
            setCardAnimation('');
            setIsSubmitting(false);
            setAnswerInput('');
          }, 1000);
          return;
        }

        resetCombo();

        // Death Note Recording
        const { addMissedQuestion } = useDeathNoteStore.getState();
        const targetWorld = (paramsRef.current.subParam || 'World1') as World;
        const targetCategory = (paramsRef.current.categoryParam || '기초') as Category;
        addMissedQuestion(currentQuestion, targetWorld, targetCategory);

        // Penalty / Game Over Logic
        if (
          paramsRef.current.onPenalty &&
          (gameMode === GAME_MODES.SURVIVAL || gameMode === 'infinite')
        ) {
          paramsRef.current.onPenalty(5);
          triggerWrongFeedback(
            '-5초',
            {
              setToastValue,
              setDamagePosition,
              setShowSlideToast,
              setShowFlash,
            },
            hapticEnabled
          );

          setTimeout(() => {
            setIsError(false);
            setDisplayValue('');
            setAnswerInput('');
            setShowFlash(false);
            setShowSlideToast(false);
            setInputAnimation('');
            setCardAnimation('');
            paramsRef.current.generateNewQuestion();
            setIsSubmitting(false);
            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }, 800);
        } else if (gameMode === GAME_MODES.SURVIVAL) {
          paramsRef.current.setWrongAnswers((prev) => [
            ...prev,
            {
              question: currentQuestion.question,
              wrongAnswer: answerInput,
              correctAnswer: correctAnswerText,
            },
          ]);

          triggerWrongFeedback(
            'WRONG',
            {
              setToastValue,
              setDamagePosition,
              setShowSlideToast,
              setShowFlash,
            },
            hapticEnabled
          );

          setTimeout(() => {
            const hasFlare = activeItems.includes('flare');
            if (hasFlare) {
              consumeActiveItem('flare');
              showFeedback('REVIVE!', 'Survival Continued', 'info');
              setIsError(false);
              setDisplayValue('');
              setShowFlash(false);
              if (setIsFlarePaused) setIsFlarePaused(true);
              paramsRef.current.generateNewQuestion();
              setIsSubmitting(false);
            } else if (lives > 1) {
              consumeLife();
              showFeedback('LIFE LOST', `${lives - 1} Hearts Left`, 'info');
              setIsError(false);
              setDisplayValue('');
              setShowFlash(false);
              paramsRef.current.generateNewQuestion();
              setIsSubmitting(false);
            } else {
              consumeLife();
              setIsError(false);
              setDisplayValue('');
              setShowFlash(false);
              setInputAnimation('');
              setCardAnimation('');
              paramsRef.current.handleGameOver();
            }
          }, 800);
        } else {
          // Time Attack etc.
          decreaseScore(SLIDE_PER_WRONG);
          triggerWrongFeedback(
            `-${SLIDE_PER_WRONG}m`,
            {
              setToastValue,
              setDamagePosition,
              setShowSlideToast,
              setShowFlash,
            },
            hapticEnabled
          );

          setTimeout(() => {
            setIsError(false);
            setDisplayValue('');
            setAnswerInput('');
            setShowFlash(false);
            setShowSlideToast(false);
            setInputAnimation('');
            setCardAnimation('');
            paramsRef.current.generateNewQuestion();
            setIsSubmitting(false);
            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => inputRef.current?.focus(), 100);
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
      setToastValue,
      setDamagePosition,
      setAnswerInput,
      increaseScore,
      decreaseScore,
      inputRef,
      showFeedback,
      onAnswerSubmitted,
      currentQuestionId,
      activeItems,
      consumeActiveItem,
      incrementCombo,
      isExhausted,
      onSafetyRopeUsed,
      resetCombo,
      setIsFlarePaused,
      lives,
      consumeLife,
      validateAnswer,
      calculateScore,
      triggerSuccessFeedback,
      triggerWrongFeedback,
    ]
  );

  return {
    handleSubmit,
  };
}
