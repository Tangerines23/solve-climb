import { useEffect } from 'react';
import { quizEventBus } from '@/lib/eventBus';
import { useQuizStore } from '../../stores/useQuizStore';
import { useGameStore } from '@/features/quiz';
import { useDeathNoteStore } from '../../stores/useDeathNoteStore';
import { useBaseCampStore } from '../../stores/useBaseCampStore';
import { vibrateLong } from '@/utils/haptic';
import { ANIMATION_CONFIG } from '@/features/quiz';
import { calculateDynamicTimeLimit } from '../../utils/quizTimeCalculator';
import type { QuizQuestion, World, Category, WrongAnswer } from '../../types/quiz';
import { ItemFeedbackRef } from '../../types/feedback';

interface GameState {
  totalQuestions: number;
  wrongAnswers: WrongAnswer[];
  questionStartTime: number | null;
  solveTimes: number[];
  gameSessionId: string | null;
  userAnswers: number[];
  questionIds: string[];
  setTotalQuestions: React.Dispatch<React.SetStateAction<number>>;
  setWrongAnswers: React.Dispatch<React.SetStateAction<WrongAnswer[]>>;
  setQuestionStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  setSolveTimes: React.Dispatch<React.SetStateAction<number[]>>;
  setGameSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setUserAnswers: React.Dispatch<React.SetStateAction<number[]>>;
  setQuestionIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleGameOver: (reason?: string) => void;
}

interface Animations {
  cardAnimation: string;
  inputAnimation: string;
  questionAnimation: string;
  showFlash: boolean;
  isError: boolean;
  showSlideToast: boolean;
  damagePosition: { left: string; top: string };
  setCardAnimation: React.Dispatch<React.SetStateAction<string>>;
  setInputAnimation: React.Dispatch<React.SetStateAction<string>>;
  setQuestionAnimation: React.Dispatch<React.SetStateAction<string>>;
  setShowFlash: React.Dispatch<React.SetStateAction<boolean>>;
  setIsError: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSlideToast: React.Dispatch<React.SetStateAction<boolean>>;
  setDamagePosition: React.Dispatch<React.SetStateAction<{ left: string; top: string }>>;
}

interface EventProcessorDeps {
  // Game State
  gameState: GameState;
  currentQuestion: QuizQuestion | null;
  currentQuestionId: string | null;
  gameMode: string;
  lives: number;

  // Params
  modeParam: string | null;
  worldParam: string | null;
  categoryParam: string | null;

  // Animation & UI
  animations: Animations;
  feedbackRef: React.RefObject<ItemFeedbackRef>;
  inputRef: React.RefObject<HTMLInputElement>;
  hapticEnabled: boolean;
  useSystemKeyboard: boolean;

  // Methods
  generateNewQuestion: () => void;
  smartHandleGameOver: (reason?: string) => void;
  handleTimeUp: () => void;
  consumeLife: () => void;

  // Setters
  setAnswerInput: (val: string) => void;
  setDisplayValue: (val: string) => void;
  setIsSubmitting: (val: boolean) => void;
  setCurrentQuestion: (q: QuizQuestion | null) => void;
  setCurrentQuestionId: (id: string | null) => void;
  setQuestionKey: React.Dispatch<React.SetStateAction<number>>;
  setInfiniteTimeLimit: (val: number) => void;
  setTotalInfiniteSolved: React.Dispatch<React.SetStateAction<number>>;

  // Modal Setters (from useQuizModals)
  setShowLastChanceModal: (val: boolean) => void;
  setShowCountdown: (val: boolean) => void;
  setShowSafetyRope: (val: boolean) => void;
  setShowTipModal: (val: boolean) => void;
  setShowPauseModal: (val: boolean) => void;
  setShowStaminaModal: (val: boolean) => void;
  setShowTutorial: (val: boolean) => void;
  setShowPromise: (val: boolean) => void;
}

/**
 * Quiz Event Processor Hook
 * Handles all quizEventBus listeners and coordinates business logic side-effects.
 * Following SRP by separating event processing from the main Context.
 */
export function useQuizEventProcessor(deps: EventProcessorDeps) {
  const {
    gameState,
    animations,
    feedbackRef,
    inputRef,
    currentQuestion,
    currentQuestionId,
    gameMode,
    modeParam,
    worldParam,
    categoryParam,
    lives,
    hapticEnabled,
    useSystemKeyboard,
    generateNewQuestion,
    smartHandleGameOver,
    handleTimeUp,
    consumeLife,
    setAnswerInput,
    setDisplayValue,
    setIsSubmitting,
    setCurrentQuestion,
    setCurrentQuestionId,
    setQuestionKey,
    setInfiniteTimeLimit,
    setTotalInfiniteSolved,
    setShowLastChanceModal,
    setShowCountdown,
    setShowSafetyRope,
    setShowTipModal,
    setShowPauseModal,
    setShowStaminaModal,
    setShowTutorial,
    setShowPromise,
  } = deps;

  const increaseScore = useQuizStore((state) => state.increaseScore);
  const decreaseScore = useQuizStore((state) => state.decreaseScore);

  useEffect(() => {
    // 1. Answer Submission Listener
    const unsubscribeAnswer = quizEventBus.on('QUIZ:ANSWER_SUBMITTED', (data) => {
      const { isCorrect, score: earnedDistance, solveTime, answer } = data;

      // Update game progression data
      gameState.setUserAnswers((prev: number[]) => [...prev, parseInt(answer, 10)]);
      gameState.setSolveTimes((p: number[]) => [...p, solveTime]);
      gameState.setTotalQuestions((p: number) => p + 1);

      if (currentQuestionId) {
        gameState.setQuestionIds((prev: string[]) => [...prev, currentQuestionId]);
      }

      if (gameMode === 'infinite' || gameMode === 'survival') {
        setTotalInfiniteSolved((p) => p + 1);
      }

      // Result handling
      if (isCorrect) {
        increaseScore(earnedDistance);
        useGameStore.getState().incrementCombo();

        animations.setCardAnimation('correct');
        animations.setShowFlash(true);
        feedbackRef.current?.show('SUCCESS', `+${earnedDistance}m`, 'success');
      } else {
        decreaseScore(earnedDistance);
        useGameStore.getState().resetCombo();

        animations.setCardAnimation('incorrect');
        animations.setIsError(true);
        if (hapticEnabled) vibrateLong();

        // Damage visual effect position
        const rect = inputRef.current?.getBoundingClientRect();
        if (rect) {
          animations.setDamagePosition({
            left: `${rect.left + rect.width / 2}px`,
            top: `${rect.top}px`,
          });
        }

        feedbackRef.current?.show('FAILURE', 'Wrong Answer', 'info');

        // Wrong answer logging
        if (currentQuestion) {
          useDeathNoteStore
            .getState()
            .addMissedQuestion(
              currentQuestion,
              (worldParam as World) || 'World1',
              (categoryParam as Category) || '기초'
            );
          gameState.setWrongAnswers((prev) => [
            ...prev,
            {
              question: currentQuestion.question,
              wrongAnswer: answer,
              correctAnswer: String(currentQuestion.answer),
            },
          ]);
        }

        // Life management for survival
        if (gameMode === 'survival') {
          if (lives > 1) {
            consumeLife();
          } else {
            consumeLife();
            quizEventBus.emit('QUIZ:GAME_OVER', { reason: 'death' });
            return;
          }
        }
      }

      // BaseCamp specific logic
      if (modeParam === 'base-camp') {
        useBaseCampStore.getState().submitAnswer(isCorrect, solveTime);
      }

      // Cleanup and prepare next question
      setTimeout(() => {
        setAnswerInput('');
        setDisplayValue('');
        setIsSubmitting(false);
        animations.setIsError(false);
        animations.setCardAnimation('');

        quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
      }, 800);
    });

    // 2. Next Question Request Listener
    const unsubscribeNext = quizEventBus.on('QUIZ:NEXT_QUESTION_REQUESTED', () => {
      generateNewQuestion();
    });

    // 3. Question Generation Completion Listener
    const unsubscribeQuestion = quizEventBus.on('QUIZ:QUESTION_GENERATED', (data) => {
      const { question, questionId } = data;

      animations.setQuestionAnimation('fade-out');

      setTimeout(() => {
        setCurrentQuestion(question);
        setCurrentQuestionId(questionId);
        setAnswerInput('');
        setDisplayValue('');
        animations.setIsError(false);
        animations.setShowFlash(false);
        animations.setQuestionAnimation('fade-in');

        if (gameMode === 'survival' || gameMode === 'infinite') {
          setQuestionKey((prev) => prev + 1);
          gameState.setQuestionStartTime(Date.now());

          // Dynamic time limit calculation (pure function)
          const dynamicTime = calculateDynamicTimeLimit({
            questionCategory: question.category || '기초',
            questionLevel: question.level!,
            totalQuestionsAnswered: gameState.totalQuestions,
          });
          setInfiniteTimeLimit(dynamicTime);
        }

        if (useSystemKeyboard && inputRef.current) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, ANIMATION_CONFIG.KEYBOARD_FOCUS_DELAY);
        }
      }, ANIMATION_CONFIG.TRANSITION_DELAY);
    });

    // 4. Submission State Listener
    const unsubscribeSubmissionStarted = quizEventBus.on('QUIZ:SUBMISSION_STARTED', () => {
      setIsSubmitting(true);
    });

    // 5. Revive Success Listener
    const unsubscribeReviveSuccess = quizEventBus.on('QUIZ:REVIVE_SUCCESS', () => {
      setIsSubmitting(false);
      animations.setIsError(false);
      setDisplayValue('');
    });

    // 6. Modal Management Listener
    const unsubscribeModalToggle = quizEventBus.on('QUIZ:UI_MODAL_TOGGLE', (data) => {
      const { modal, show } = data;
      switch (modal) {
        case 'lastChance':
          setShowLastChanceModal(show);
          break;
        case 'countdown':
          setShowCountdown(show);
          break;
        case 'safetyRope':
          setShowSafetyRope(show);
          break;
        case 'tip':
          setShowTipModal(show);
          break;
        case 'pause':
          setShowPauseModal(show);
          break;
        case 'stamina':
          setShowStaminaModal(show);
          break;
        case 'tutorial':
          setShowTutorial(show);
          break;
        case 'promise':
          setShowPromise(show);
          break;
      }
    });

    // 7. Input Validation Listener
    const unsubscribeInvalid = quizEventBus.on('QUIZ:INVALID_INPUT', () => {
      animations.setIsError(true);
      if (hapticEnabled) vibrateLong();
      setTimeout(() => {
        animations.setIsError(false);
        setIsSubmitting(false);
      }, 500);
    });

    // 8. Game Over Listener
    const unsubscribeGameOver = quizEventBus.on('QUIZ:GAME_OVER', (data) => {
      smartHandleGameOver(data?.reason);
    });

    // 9. Timer Up Listener
    const unsubscribeTimerUp = quizEventBus.on('QUIZ:TIMER_UP', () => {
      handleTimeUp();
    });

    // 10. Penalty Listener
    const unsubscribePenalty = quizEventBus.on('QUIZ:PENALTY', (data) => {
      useQuizStore.getState().decreaseScore(data.amount);
    });

    return () => {
      unsubscribeAnswer();
      unsubscribeNext();
      unsubscribeQuestion();
      unsubscribeSubmissionStarted();
      unsubscribeReviveSuccess();
      unsubscribeModalToggle();
      unsubscribeInvalid();
      unsubscribeGameOver();
      unsubscribeTimerUp();
      unsubscribePenalty();
    };
  }, [
    gameMode,
    currentQuestionId,
    gameState,
    smartHandleGameOver,
    handleTimeUp,
    increaseScore,
    decreaseScore,
    animations,
    hapticEnabled,
    lives,
    consumeLife,
    modeParam,
    currentQuestion,
    setAnswerInput,
    setDisplayValue,
    setIsSubmitting,
    categoryParam,
    worldParam,
    useSystemKeyboard,
    generateNewQuestion,
    setCurrentQuestion,
    setCurrentQuestionId,
    setQuestionKey,
    setInfiniteTimeLimit,
    setTotalInfiniteSolved,
    setShowLastChanceModal,
    setShowCountdown,
    setShowSafetyRope,
    setShowTipModal,
    setShowPauseModal,
    setShowStaminaModal,
    setShowTutorial,
    setShowPromise,
    feedbackRef,
    inputRef,
  ]);
}
