import { useGameStore } from '../../stores/useGameStore';
import { useSettingsStore } from '@/features/mypage';

export function useFeverEffectBridge() {
  const { feverLevel, combo } = useGameStore();
  const comboValue = combo.value;
  const animationEnabled = useSettingsStore((state: any) => state.animationEnabled);

  return {
    feverLevel,
    combo: comboValue,
    animationEnabled,
    shouldShow: feverLevel > 0 || comboValue >= 2,
  };
}
