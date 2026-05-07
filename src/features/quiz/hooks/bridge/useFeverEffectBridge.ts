import { useGameStore } from '../../stores/useGameStore';
import { useSettingsStore } from '@/features/mypage';

export function useFeverEffectBridge() {
  const { feverLevel, combo } = useGameStore();
  const animationEnabled = useSettingsStore((state: any) => state.animationEnabled);

  return {
    feverLevel,
    combo,
    animationEnabled,
    shouldShow: feverLevel > 0 || combo >= 2,
  };
}
