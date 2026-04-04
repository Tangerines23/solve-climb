import { useState, useCallback } from 'react';
import { useQuizStore } from '@/stores/useQuizStore';
import { useGameStore } from '@/stores/useGameStore';
import { useQuizAnimations } from './useQuizAnimations';

type QuizAnimations = ReturnType<typeof useQuizAnimations>;

interface UseQuizGameplayProps {
  generateNewQuestion: () => void;
  smartHandleGameOver: (reason: string) => void;
  animations: QuizAnimations;
  setToastValue: (val: string) => void;
}

export function useQuizGameplay({
  generateNewQuestion,
  smartHandleGameOver,
  animations,
  setToastValue,
}: UseQuizGameplayProps) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [remainingPauses, setRemainingPauses] = useState(3);
  const [timerResetKey, setTimerResetKey] = useState(0);

  const { incrementCombo } = useGameStore();

  const handlePauseClick = useCallback(() => {
    if (remainingPauses > 0) {
      setShowPauseModal(true);
    }
  }, [remainingPauses]);

  const handlePauseResume = useCallback(() => {
    setRemainingPauses((prev) => prev - 1);
    generateNewQuestion();
    setShowPauseModal(false);
    setShowCountdown(true);
  }, [generateNewQuestion]);

  const handlePauseExit = useCallback(() => {
    setShowPauseModal(false);
    smartHandleGameOver('manual_exit');
  }, [smartHandleGameOver]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
  }, []);

  const handleLastSpurt = useCallback(() => {
    useQuizStore.getState().setTimeLimit(15);
    for (let i = 0; i < 5; i++) incrementCombo();

    setToastValue('🔥 LAST SPURT! +15s 🔥');
    animations.setDamagePosition({ left: '50%', top: '50%' });
    animations.setShowSlideToast(true);
    setTimeout(() => animations.setShowSlideToast(false), 2000);
    setTimerResetKey((prev) => prev + 1);
  }, [incrementCombo, animations, setToastValue]);

  const handleSafetyRopeUsed = useCallback(() => {
    setShowSafetyRope(true);
    setTimerResetKey((prev) => prev + 1);
  }, []);

  return {
    showCountdown,
    showSafetyRope,
    setShowSafetyRope,
    showPauseModal,
    remainingPauses,
    timerResetKey,
    handlePauseClick,
    handlePauseResume,
    handlePauseExit,
    handleCountdownComplete,
    handleLastSpurt,
    handleSafetyRopeUsed,
    setShowCountdown,
    setTimerResetKey,
  };
}
