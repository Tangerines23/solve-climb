import { useGameStore } from '@/features/quiz';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useFeverEffectBridge() {
  const { feverLevel, combo } = useGameStore();
  const animationEnabled = useSettingsStore((state) => state.animationEnabled);

  return {
    feverLevel,
    combo,
    animationEnabled,
    shouldShow: feverLevel > 0 || combo >= 2,
  };
}
