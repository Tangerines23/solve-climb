import { useCallback } from 'react';
import { vibrateMedium, vibrateLong } from '@/utils/haptic';
import { sound } from '@/utils/sound';
import { useGameStore } from '@/stores/useGameStore';

interface FeedbackHandlers {
  setToastValue: (val: string) => void;
  setDamagePosition: (pos: { left: string; top: string }) => void;
  setShowSlideToast: (show: boolean) => void;
  setShowFlash: (show: boolean) => void;
}

/**
 * 퀴즈 시각적/진동/효과음 피드백을 담당하는 훅
 */
export function useQuizFeedback() {
  const triggerSuccessFeedback = useCallback(
    (earnedDistance: number, handlers: FeedbackHandlers, hapticEnabled: boolean = true) => {
      if (hapticEnabled) {
        vibrateMedium();
      }

      const currentCombo = useGameStore.getState().combo;
      if (currentCombo > 1) {
        sound.playCombo(currentCombo);
      } else {
        sound.playCorrect();
      }

      handlers.setToastValue(`+${earnedDistance}m`);

      // 랜덤 위치 생성 (X: 10-80%, Y: 55-70%) - 문제 텍스트를 가리지 않도록 하단으로 보정
      const randomLeft = Math.floor(Math.random() * 70) + 10;
      const randomTop = Math.floor(Math.random() * 15) + 55;
      handlers.setDamagePosition({ left: `${randomLeft}%`, top: `${randomTop}%` });

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

      sound.playWrong();

      handlers.setToastValue(penaltyText);

      // 랜덤 위치 생성 (X: 10-80%, Y: 55-70%) - 문제 텍스트를 가리지 않도록 하단으로 보정
      const randomLeft = Math.floor(Math.random() * 70) + 10;
      const randomTop = Math.floor(Math.random() * 15) + 55;
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
