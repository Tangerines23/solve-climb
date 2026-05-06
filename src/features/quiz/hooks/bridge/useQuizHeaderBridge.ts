import { useGameStore } from '@/features/quiz/stores/useGameStore';

export function useQuizHeaderBridge() {
  const combo = useGameStore((state) => state.combo);

  return {
    combo,
  };
}
