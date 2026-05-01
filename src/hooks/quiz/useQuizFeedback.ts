import { useCallback } from 'react';
import { vibrateMedium, vibrateLong } from '../../utils/haptic';

interface FeedbackHandlers {
  setToastValue: (val: string) => void;
  setDamagePosition: (pos: { left: string; top: string }) => void;
  setShowSlideToast: (show: boolean) => void;
  setShowFlash: (show: boolean) => void;
}

/**
 * 퀴즈 시각적/진동 피드백을 담당하는 훅
 */
export function useQuizFeedback() {
  const triggerSuccessFeedback = useCallback(
    (earnedDistance: number, handlers: FeedbackHandlers, hapticEnabled: boolean = true) => {
      if (hapticEnabled) {
        vibrateMedium();
      }

      handlers.setToastValue(`+${earnedDistance}m`);
      handlers.setDamagePosition({ left: '75%', top: '20%' });
      handlers.setShowSlideToast(true);
      setTimeout(() => handlers.setShowSlideToast(false), 700);
    },
    []
  );

  const triggerWrongFeedback = useCallback(
    (penaltyText: string, handlers: FeedbackHandlers, hapticEnabled: boolean = true) => {
      if (hapticEnabled) {
        vibrateLong();
      }

      handlers.setToastValue(penaltyText);

      // 랜덤 위치 생성 (X: 10-80%, Y: 10-40%)
      const randomLeft = Math.floor(Math.random() * 70) + 10;
      const randomTop = Math.floor(Math.random() * 30) + 10;
      handlers.setDamagePosition({ left: `${randomLeft}%`, top: `${randomTop}%` });

      handlers.setShowSlideToast(true);
      setTimeout(() => handlers.setShowSlideToast(false), 700);

      handlers.setShowFlash(true);
      setTimeout(() => handlers.setShowFlash(false), 400);
    },
    []
  );

  return { triggerSuccessFeedback, triggerWrongFeedback };
}
