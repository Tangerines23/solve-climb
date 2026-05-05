import { useGameStore } from '@/features/quiz';

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
