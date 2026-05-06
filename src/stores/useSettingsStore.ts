// 설정 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type KeyboardType = 'custom' | 'qwerty';

interface SettingsState {
  hapticEnabled: boolean; // 진동 활성화 여부
  keyboardType: KeyboardType; // 키보드 타입
  animationEnabled: boolean; // 애니메이션 활성화 여부
  staticMode: boolean; // 정적 모드 여부
  _hasHydrated: boolean; // 하이드레이션 완료 여부
  setHapticEnabled: (enabled: boolean) => void;
  setKeyboardType: (type: KeyboardType) => void;
  setAnimationEnabled: (enabled: boolean) => void;
  setStaticMode: (enabled: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true, // 기본값: 활성화
      keyboardType: 'custom', // 기본값: 커스텀 키패드
      animationEnabled: true, // 기본값: 활성화
      staticMode: false, // 기본값: 비활성화
      _hasHydrated: false, // 기본값: 비활성화
      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });
      },
      setKeyboardType: (type) => {
        set({ keyboardType: type });
      },
      setAnimationEnabled: (enabled) => {
        set({ animationEnabled: enabled });
      },
      setStaticMode: (enabled) => {
        set({ staticMode: enabled });
      },
      setHasHydrated: (hydrated) => {
        set({ _hasHydrated: hydrated });
      },
    }),
    {
      name: 'solve-climb-settings',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
