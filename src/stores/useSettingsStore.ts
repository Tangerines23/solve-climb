// 설정 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type KeyboardType = 'custom' | 'qwerty';

interface SettingsState {
  hapticEnabled: boolean; // 진동 활성화 여부
  keyboardType: KeyboardType; // 키보드 타입
  setHapticEnabled: (enabled: boolean) => void;
  setKeyboardType: (type: KeyboardType) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true, // 기본값: 활성화
      keyboardType: 'custom', // 기본값: 커스텀 키패드
      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });
      },
      setKeyboardType: (type) => {
        set({ keyboardType: type });
      },
    }),
    {
      name: 'solve-climb-settings',
    }
  )
);
