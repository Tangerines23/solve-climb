import { useGameStore } from '@/features/quiz/stores/useGameStore';

export function useGameActions() {
  const { setExhausted, setCombo, resetCombo, isExhausted, feverLevel } = useGameStore();

  return {
    setExhausted,
    setCombo,
    resetCombo,
    isExhausted,
    feverLevel,
  };
}
