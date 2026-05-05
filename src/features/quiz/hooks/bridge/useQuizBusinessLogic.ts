import { UI_MESSAGES, ANIMATION_CONFIG } from '@/features/quiz/constants/game';
import { useCallback } from 'react';
import { AdService } from '@/utils/adService';

interface UseQuizBusinessLogicParams {
  setToastValue: (v: string) => void;
  setShowSlideToast: (v: boolean) => void;
  showGlobalToast: (text: string, icon?: string) => void;
  refundStamina: () => Promise<{ success: boolean }>;
  recoverStaminaAds: () => Promise<{ success: boolean; message?: string }>;
  handleGameOver: (reason?: string) => void;
  totalQuestions: number;
}

/**
 * QuizPage의 핵심 비즈니스 로직(광고 시청, 게임 오버, 스테미너 회복)을 관리하는 커스텀 훅
 */
export const useQuizBusinessLogic = ({
  setToastValue,
  setShowSlideToast,
  showGlobalToast,
  refundStamina,
  recoverStaminaAds,
  handleGameOver,
  totalQuestions,
}: UseQuizBusinessLogicParams) => {
  // [광고 시청을 통한 부활 시작]
  const handleWatchAdRevive = useCallback(async () => {
    setShowSlideToast(true);
    setToastValue(UI_MESSAGES.AD_WATCH_START);

    const adResult = await AdService.showRewardedAd('revive');

    if (adResult.success) {
      setShowSlideToast(true);
      setToastValue(UI_MESSAGES.AD_WATCH_COMPLETE);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } else {
      setToastValue(UI_MESSAGES.AD_WATCH_FAILED(adResult.error));
      return false;
    }
  }, [setShowSlideToast, setToastValue]);

  // [스마트 게임 오버 처리]
  const smartHandleGameOver = useCallback(
    async (reason?: string) => {
      if (totalQuestions === 0 && (reason === 'timeout' || reason === 'manual_exit')) {
        try {
          const res = await refundStamina();
          if (res.success) {
            showGlobalToast(UI_MESSAGES.STAMINA_REFUNDED, '🫧');
          }
        } catch (error) {
          console.error('[useQuizBusinessLogic] Refund error:', error);
        }
      }
      handleGameOver(reason);
    },
    [totalQuestions, handleGameOver, refundStamina, showGlobalToast]
  );

  // [스테미너 광고 회복]
  const handleStaminaAdRecovery = useCallback(
    async (setShowStaminaModal: (s: boolean) => void) => {
      setShowSlideToast(true);
      setToastValue(UI_MESSAGES.AD_WATCH_START);

      const adResult = await AdService.showRewardedAd('stamina_recharge');

      if (adResult.success) {
        const result = await recoverStaminaAds();
        if (result.success) {
          setShowStaminaModal(false);
          setShowSlideToast(true);
          setToastValue(UI_MESSAGES.STAMINA_RECHARGED_FULL);
          setTimeout(() => window.location.reload(), ANIMATION_CONFIG.RELOAD_DELAY);
        } else {
          setToastValue('충전 실패: ' + result.message);
        }
      } else {
        setToastValue(UI_MESSAGES.AD_WATCH_FAILED(adResult.error));
      }
    },
    [setShowSlideToast, setToastValue, recoverStaminaAds]
  );

  return {
    handleWatchAdRevive,
    smartHandleGameOver,
    handleStaminaAdRecovery,
  };
};
