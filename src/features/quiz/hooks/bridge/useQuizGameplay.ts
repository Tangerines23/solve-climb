import { useState, useCallback, useEffect } from 'react';
import { useQuizStore } from '../../stores/useQuizStore';
import { useGameStore } from '@/features/quiz/stores/useGameStore';

import { quizEventBus } from '@/lib/eventBus';

interface UseQuizGameplayProps {
  setToastValue: (val: string) => void;
}

export function useQuizGameplay({ setToastValue }: UseQuizGameplayProps) {
  const [remainingPauses, setRemainingPauses] = useState(3);
  const [timerResetKey, setTimerResetKey] = useState(0);

  const { incrementCombo } = useGameStore();

  const handlePauseClick = useCallback(() => {
    if (remainingPauses > 0) {
      quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'pause', show: true });
    }
  }, [remainingPauses]);

  const handleTutorialClick = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'tutorial', show: true });
  }, []);

  const handlePauseResume = useCallback(() => {
    setRemainingPauses((prev) => prev - 1);
    quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'pause', show: false });
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'countdown', show: true });
  }, []);

  const handlePauseExit = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'pause', show: false });
    quizEventBus.emit('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  }, []);

  const handleLastSpurt = useCallback(() => {
    useQuizStore.getState().setTimeLimit(15);
    for (let i = 0; i < 5; i++) incrementCombo();

    setToastValue('🔥 LAST SPURT! +15s 🔥');
    // NOTE: Slide toast animation is still handled via direct hook/prop for now
    // as it's a complex animation state.
    setTimerResetKey((prev) => prev + 1);
  }, [incrementCombo, setToastValue]);

  const handleSafetyRopeUsed = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'safetyRope', show: true });
    setTimerResetKey((prev) => prev + 1);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'countdown', show: false });
  }, []);

  useEffect(() => {
    const unsubscribeCountdown = quizEventBus.on(
      'QUIZ:COUNTDOWN_COMPLETE',
      handleCountdownComplete
    );
    const unsubscribeSafetyRope = quizEventBus.on('QUIZ:SAFETY_ROPE_USED', handleSafetyRopeUsed);
    const unsubscribeLastSpurt = quizEventBus.on('QUIZ:LAST_SPURT', handleLastSpurt);

    return () => {
      unsubscribeCountdown();
      unsubscribeSafetyRope();
      unsubscribeLastSpurt();
    };
  }, [handleCountdownComplete, handleSafetyRopeUsed, handleLastSpurt]);

  return {
    remainingPauses,
    timerResetKey,
    handlePauseClick,
    handleTutorialClick,
    handlePauseResume,
    handlePauseExit,
    handleCountdownComplete,
    handleLastSpurt,
    handleSafetyRopeUsed,
    setTimerResetKey,
  };
}
