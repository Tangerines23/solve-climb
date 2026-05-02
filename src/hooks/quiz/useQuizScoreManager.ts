import { useCallback } from 'react';
import { useQuizStore } from '@/stores/useQuizStore';
import { useGameStore } from '@/stores/useGameStore';
import { useQuizScoring } from './useQuizScoring';

/**
 * 퀴즈 점수 및 콤보 상태 관리를 전담하는 훅
 */
export function useQuizScoreManager() {
  const score = useQuizStore((state) => state.score);
  const increaseScore = useQuizStore((state) => state.increaseScore);
  const decreaseScore = useQuizStore((state) => state.decreaseScore);

  const combo = useGameStore((state) => state.combo);
  const feverLevel = useGameStore((state) => state.feverLevel);
  const lives = useGameStore((state) => state.lives);
  const isExhausted = useGameStore((state) => state.isExhausted);
  const incrementCombo = useGameStore((state) => state.incrementCombo);
  const resetCombo = useGameStore((state) => state.resetCombo);
  const consumeLife = useGameStore((state) => state.consumeLife);

  const { calculateScore } = useQuizScoring();

  /**
   * 정답 처리 시 점수 증가 및 콤보 처리
   */
  const handleCorrectAnswer = useCallback(
    (currentLevel: number, category: string | null, sub: string | null, gameMode: string) => {
      const earnedDistance = calculateScore(
        currentLevel,
        category,
        sub,
        gameMode,
        feverLevel,
        isExhausted
      );
      increaseScore(earnedDistance);
      incrementCombo();
      return earnedDistance;
    },
    [calculateScore, feverLevel, isExhausted, increaseScore, incrementCombo]
  );

  /**
   * 오답 처리 시 콤보 리셋 및 생명력 감소
   */
  const handleWrongAnswer = useCallback(() => {
    resetCombo();
    consumeLife();
  }, [resetCombo, consumeLife]);

  return {
    // 상태
    score,
    combo,
    feverLevel,
    lives,
    isExhausted,

    // 핸들러
    handleCorrectAnswer,
    handleWrongAnswer,

    // 저수준 조작 (필요한 경우 대비)
    increaseScore,
    decreaseScore,
    resetCombo,
    incrementCombo,
    consumeLife,
  };
}
