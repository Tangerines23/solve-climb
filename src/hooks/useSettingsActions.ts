import { useSettingsStore } from '../stores/useSettingsStore';

export function useSettingsActions() {
  const { 
    animationEnabled, 
    setAnimationEnabled, 
    hapticEnabled, 
    setHapticEnabled,
    keyboardType,
    setKeyboardType,
    staticMode,
    setStaticMode
  } = useSettingsStore();

  return {
    animationEnabled,
    setAnimationEnabled,
    hapticEnabled,
    setHapticEnabled,
    keyboardType,
    setKeyboardType,
    staticMode,
    setStaticMode
  };
}
