import { useGameStore } from '../../stores/useGameStore';

export function useQuizHeaderBridge() {
  const combo = useGameStore((state) => state.combo.value);

  return {
    combo,
  };
}
