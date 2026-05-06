// 진동(Haptic) 유틸리티 - 브라우저 Vibration API 사용

let hapticConfigGetter: (() => boolean) | null = null;

/**
 * 전역 설정을 연결하기 위한 등록 함수
 */
export const registerHapticConfig = (getter: () => boolean): void => {
  hapticConfigGetter = getter;
};

/**
 * 브라우저 진동 실행
 */
const vibrateBrowser = (duration: number): void => {
  // 전역 설정 확인
  const hapticEnabled = hapticConfigGetter ? hapticConfigGetter() : true;
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

/**
 * 성공 진동 — 50ms (vibrateMedium과 동일)
 */
export const vibrateSuccess = (): void => {
  vibrateBrowser(50);
};

/**
 * 에러 진동 — 100ms (vibrateLong과 동일)
 */
export const vibrateError = (): void => {
  vibrateBrowser(100);
};
