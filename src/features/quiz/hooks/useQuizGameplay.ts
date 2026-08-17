import { useState, useCallback, useEffect } from 'react';
import { useQuizStore } from '@/stores/useQuizStore';
import { useGameStore } from '@/stores/useGameStore';
import { quizEventBus } from '@/lib/eventBus';

interface UseQuizGameplayProps {
  setToastValue: (val: string) => void;
}

/**
 * 인게임 특수 액션 및 생명주기 제어 훅 (일시정지, 라스트 스퍼트, 안전로프, 카운트다운)
 * @listens QUIZ:LAST_SPURT
 * @listens QUIZ:SAFETY_ROPE_USED
 * @listens QUIZ:COUNTDOWN_COMPLETE
 * @emits QUIZ:UI_MODAL_TOGGLE
 * @emits QUIZ:NEXT_QUESTION_REQUESTED
 * @emits QUIZ:GAME_OVER
 */
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

  /**
   * 라스트 스퍼트 발동 핸들러: 시간 15초 리셋, 콤보 +5(피버 모드 즉시 돌입), 슬라이드 토스트
   */
  const handleLastSpurt = useCallback(() => {
    useQuizStore.getState().setTimeLimit(15);
    for (let i = 0; i < 5; i++) incrementCombo();

    setToastValue('🔥 LAST SPURT! +15s 🔥');
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
