// 진동(Haptic) 유틸리티 - 브라우저 Vibration API 및 백그라운드 누수 방지

import { useSettingsStore } from '../stores/useSettingsStore';
import { audioContextManager } from './sound/audioContext';

/**
 * 브라우저 및 네이티브 진동 실행
 * - 앱이 백그라운드 상태(화면 꺼짐, 다른 앱 전환)일 때는 진동 실행 차단
 */
const vibrateBrowser = (duration: number): void => {
  // 전역 설정 확인
  const hapticEnabled = useSettingsStore.getState().hapticEnabled;
  if (!hapticEnabled) return;

  // 백그라운드 상태일 경우 진동 차단 (배터리 및 사용자 방해 방지)
  if (typeof document !== 'undefined' && document.hidden) return;
  if (audioContextManager.isBackground() || audioContextManager.isTerminatedState()) return;

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
