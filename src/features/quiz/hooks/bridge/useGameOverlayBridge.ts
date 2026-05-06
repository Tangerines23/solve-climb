import { useGameStore } from '@/features/quiz/stores/useGameStore';

export function useGameOverlayBridge() {
  const { showVignette, showSpeedLines, feverLevel } = useGameStore();

  return {
    showVignette,
    showSpeedLines,
    feverLevel,
  };
}
