// 진동(Haptic) 유틸리티 - 브라우저 Vibration API 사용

import { useSettingsStore } from '../stores/useSettingsStore';

/**
 * 브라우저 진동 실행
 */
const vibrateBrowser = (duration: number): void => {
  // 전역 설정 확인
  const hapticEnabled = useSettingsStore.getState().hapticEnabled;
  if (!hapticEnabled) return;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // 진동이 지원되지 않거나 실패한 경우 무시
    }
  }
};

/**
 * 짧은 진동 (버튼 클릭 등) — 10ms
 */
export const vibrateShort = (): void => {
  vibrateBrowser(10);
};

/**
 * 중간 진동 (정답 맞췄을 때 등) — 50ms
 */
export const vibrateMedium = (): void => {
  vibrateBrowser(50);
};

/**
 * 긴 진동 (에러나 중요한 이벤트) — 100ms
 */
export const vibrateLong = (): void => {
  vibrateBrowser(100);
};
