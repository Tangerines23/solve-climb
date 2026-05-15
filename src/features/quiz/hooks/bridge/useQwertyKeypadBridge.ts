import { vibrateShort } from '@/utils/haptic';

export function useQwertyKeypadBridge() {
  const handleVibrate = () => {
    vibrateShort();
  };

  return {
    vibrate: handleVibrate,
  };
}
