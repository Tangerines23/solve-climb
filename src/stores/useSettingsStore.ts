// 설정 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  hapticEnabled: boolean; // 진동 활성화 여부
  setHapticEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true, // 기본값: 활성화
      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });
      },
    }),
    {
      name: 'solve-climb-settings',
    }
  )
);

