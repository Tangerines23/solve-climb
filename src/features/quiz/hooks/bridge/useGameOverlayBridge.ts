import { useGameStore } from '@/features/quiz';

export function useGameOverlayBridge() {
  const { showVignette, showSpeedLines, feverLevel } = useGameStore();

  return {
    showVignette,
    showSpeedLines,
    feverLevel,
  };
}
