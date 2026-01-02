// 진동(Haptic) 유틸리티 함수 - 토스 표준 API 사용 (브라우저 환경 fallback 포함)
import { generateHapticFeedback, type HapticFeedbackType } from '@apps-in-toss/web-framework';

/**
 * 토스 앱 환경인지 확인
 */
const isTossAppEnvironment = (): boolean => {
  return !!(window as unknown as Record<string, unknown>).ReactNativeWebView;
};

/**
 * 브라우저 진동 실행 (fallback)
 */
const vibrateBrowser = (duration: number): void => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // 진동이 지원되지 않거나 실패한 경우 무시
    }
  }
};

/**
 * 짧은 진동 (버튼 클릭 등)
 * 토스 앱: softLight
 * 브라우저: 10ms
 */
export const vibrateShort = (): void => {
  if (isTossAppEnvironment()) {
    try {
      generateHapticFeedback({ type: 'softLight' as HapticFeedbackType });
    } catch {
      // 실패 시 브라우저 fallback
      vibrateBrowser(10);
    }
  } else {
    vibrateBrowser(10);
  }
};

/**
 * 중간 진동 (정답 맞췄을 때 등)
 * 토스 앱: softMedium
 * 브라우저: 50ms
 */
export const vibrateMedium = (): void => {
  if (isTossAppEnvironment()) {
    try {
      generateHapticFeedback({ type: 'softMedium' });
    } catch {
      // 실패 시 브라우저 fallback
      vibrateBrowser(50);
    }
  } else {
    vibrateBrowser(50);
  }
};

/**
 * 긴 진동 (에러나 중요한 이벤트)
 * 토스 앱: softHeavy
 * 브라우저: 100ms
 */
export const vibrateLong = (): void => {
  if (isTossAppEnvironment()) {
    try {
      generateHapticFeedback({ type: 'softHeavy' as HapticFeedbackType });
    } catch {
      // 실패 시 브라우저 fallback
      vibrateBrowser(100);
    }
  } else {
    vibrateBrowser(100);
  }
};
