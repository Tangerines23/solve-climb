import { vibrateMedium } from '@/utils/haptic';

export function useEquationVisualizerBridge() {
  const handleVibrate = () => {
    vibrateMedium();
  };

  return {
    vibrate: handleVibrate,
  };
}
