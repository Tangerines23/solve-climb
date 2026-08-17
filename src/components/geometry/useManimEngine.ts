import { useState, useEffect, useRef, useCallback } from 'react';

interface UseManimEngineOptions {
  totalSteps: number;
  holdDuration?: number; // ms
  moveDuration?: number; // ms
}

export function useManimEngine({
  totalSteps,
  holdDuration = 2000,
  moveDuration = 1000,
}: UseManimEngineOptions) {
  const [t, setT] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const stepDuration = holdDuration + moveDuration;
  const totalCycle = totalSteps * stepDuration;

  const animStateRef = useRef<{
    startTime: number | null;
    accumulatedPauseTime: number;
    pauseStart: number | null;
  }>({
    startTime: null,
    accumulatedPauseTime: 0,
    pauseStart: null,
  });

  // Single Master rAF loop
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const state = animStateRef.current;

      if (isPausedRef.current) {
        if (!state.pauseStart) state.pauseStart = now;
        animId = requestAnimationFrame(tick);
        return;
      }

      if (state.pauseStart) {
        state.accumulatedPauseTime += now - state.pauseStart;
        state.pauseStart = null;
      }

      if (state.startTime === null) state.startTime = now;
      const elapsed = (now - state.startTime - state.accumulatedPauseTime) % totalCycle;
      setT(elapsed / totalCycle);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [totalCycle]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const elapsedMs = t * totalCycle;
  const stepIndex = Math.floor(elapsedMs / stepDuration) % totalSteps;
  const stepElapsed = elapsedMs % stepDuration;

  // Calculate eased progress (0 to 1) for the current transition
  const getEasedProgress = useCallback(() => {
    if (stepElapsed < holdDuration) {
      return 0; // Stationary hold phase
    }
    const moveProgress = (stepElapsed - holdDuration) / moveDuration;
    const rawT = Math.min(1, Math.max(0, moveProgress));
    return rawT * rawT * (3 - 2 * rawT); // Smoothstep curve
  }, [stepElapsed, holdDuration, moveDuration]);

  return {
    t,
    stepIndex,
    stepElapsed,
    isPaused,
    togglePause,
    getEasedProgress,
    totalCycle,
    stepDuration,
  };
}
