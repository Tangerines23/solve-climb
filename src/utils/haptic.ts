// 진동(Haptic) 유틸리티 - 브라우저 Vibration API 및 백그라운드 누수 방지

import { useSettingsStore } from '../stores/useSettingsStore';
import { audioContextManager } from './sound/audioContext';

export const HAPTIC_DURATION = {
  SHORT: 10,
  MEDIUM: 50,
  LONG: 100,
  STOP: 0,
} as const;

export const HAPTIC_PATTERN = {
  SUCCESS: [30, 40, 30],
  ERROR: [50, 40, 50],
  COMBO: [20, 30, 20, 30, 40],
} as const;

/**
 * 브라우저 및 네이티브 진동 실행
 * - 앱이 백그라운드 상태(화면 꺼짐, 다른 앱 전환)일 때는 진동 실행 차단
 * - 접근성(prefers-reduced-motion) 활성화 시 진동 억제
 */
const vibrateBrowser = (pattern: number | number[]): void => {
  // 전역 설정 확인
  const hapticEnabled = useSettingsStore.getState().hapticEnabled;
  if (!hapticEnabled) return;

  // 접근성(동작 줄이기/절전 모드) 확인
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  ) {
    return;
  }

  // 백그라운드 상태일 경우 진동 차단 (배터리 및 사용자 방해 방지)
  if (typeof document !== 'undefined' && document.hidden) return;
  if (audioContextManager.isBackground() || audioContextManager.isTerminatedState()) return;

  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // 진동이 지원되지 않거나 실패한 경우 무시
  }
};

/**
 * 진행 중인 모든 진동 즉각 중단
 * - 백그라운드 전환, 앱 일시정지, 페이지 이탈 시 진동 잔여 누출 차단
 */
export const stopVibration = (): void => {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;

  try {
    navigator.vibrate(HAPTIC_DURATION.STOP);
  } catch {
    // 진동 중단 호출 실패 무시
  }
};

/**
 * 짧은 진동 (버튼 클릭 등) — 10ms
 */
export const vibrateShort = (): void => {
  vibrateBrowser(HAPTIC_DURATION.SHORT);
};

/**
 * 중간 진동 (정답 맞췄을 때 등) — 50ms
 */
export const vibrateMedium = (): void => {
  vibrateBrowser(HAPTIC_DURATION.MEDIUM);
};

/**
 * 긴 진동 (에러나 중요한 이벤트) — 100ms
 */
export const vibrateLong = (): void => {
  vibrateBrowser(HAPTIC_DURATION.LONG);
};

/**
 * 정답 / 성공 패턴 진동 (경쾌한 2단 진동) — [30ms, 40ms, 30ms]
 */
export const vibrateSuccess = (): void => {
  vibrateBrowser([...HAPTIC_PATTERN.SUCCESS]);
};

/**
 * 오답 / 에러 패턴 진동 (묵직한 경고 진동) — [50ms, 40ms, 50ms]
 */
export const vibrateError = (): void => {
  vibrateBrowser([...HAPTIC_PATTERN.ERROR]);
};

/**
 * 콤보 / 대형 보너스 패턴 진동 (리듬감 있는 연속 진동) — [20ms, 30ms, 20ms, 30ms, 40ms]
 */
export const vibrateCombo = (): void => {
  vibrateBrowser([...HAPTIC_PATTERN.COMBO]);
};
