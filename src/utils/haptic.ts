// 진동(Haptic) 유틸리티 함수

/**
 * 진동을 실행합니다.
 * @param duration 진동 지속 시간 (밀리초), 기본값 10ms
 */
export const vibrate = (duration: number = 10): void => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (error) {
      // 진동이 지원되지 않거나 실패한 경우 무시
      console.warn('Vibration not supported or failed:', error);
    }
  }
};

/**
 * 짧은 진동 (버튼 클릭 등)
 */
export const vibrateShort = (): void => {
  vibrate(10);
};

/**
 * 중간 진동 (정답 맞췄을 때 등)
 */
export const vibrateMedium = (): void => {
  vibrate(50);
};

/**
 * 긴 진동 (에러나 중요한 이벤트)
 */
export const vibrateLong = (): void => {
  vibrate(100);
};

