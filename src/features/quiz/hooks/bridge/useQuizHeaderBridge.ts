import { useGameStore } from '@/features/quiz';

export function useQuizHeaderBridge() {
  const combo = useGameStore((state) => state.combo);

  return {
    combo,
  };
}
