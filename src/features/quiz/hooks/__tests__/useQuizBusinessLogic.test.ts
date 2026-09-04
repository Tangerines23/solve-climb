import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizBusinessLogic } from '../useQuizBusinessLogic';
import { AdService } from '@/utils/adService';
import { useUserStore } from '@/stores/useUserStore';
import { UI_MESSAGES } from '@/constants/ui';

vi.mock('@/utils/adService', () => ({
  AdService: {
    showRewardedAd: vi.fn(),
  },
}));

describe('useQuizBusinessLogic', () => {
  const setToastValue = vi.fn();
  const setShowSlideToast = vi.fn();
  const showGlobalToast = vi.fn();
  const refundStamina = vi.fn().mockResolvedValue({ success: true });
  const recoverStaminaAds = vi.fn();
  const handleGameOver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleWatchAdRevive: should show ad and return true on success', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useQuizBusinessLogic({
        setToastValue,
        setShowSlideToast,
        showGlobalToast,
        refundStamina,
        recoverStaminaAds,
        handleGameOver,
        totalQuestions: 5,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.handleWatchAdRevive();
    });

    expect(AdService.showRewardedAd).toHaveBeenCalledWith('revive');
    expect(res).toBe(true);
    expect(setToastValue).toHaveBeenCalledWith(UI_MESSAGES.AD_WATCH_COMPLETE);
  });

  it('handleWatchAdRevive: should return false and display error toast on failure', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({
      success: false,
      error: '네트워크 연결 실패',
    });

    const { result } = renderHook(() =>
      useQuizBusinessLogic({
        setToastValue,
        setShowSlideToast,
        showGlobalToast,
        refundStamina,
        recoverStaminaAds,
        handleGameOver,
        totalQuestions: 5,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.handleWatchAdRevive();
    });

    expect(AdService.showRewardedAd).toHaveBeenCalledWith('revive');
    expect(res).toBe(false);
    expect(setToastValue).toHaveBeenCalledWith(UI_MESSAGES.AD_WATCH_FAILED('네트워크 연결 실패'));
  });

  it('handleStaminaAdRecovery: should call recoverStaminaAds, close modal, and refresh store data', async () => {
    recoverStaminaAds.mockResolvedValue({ success: true, message: '완충 완료' });
    const setShowStaminaModal = vi.fn();
    const fetchUserDataSpy = vi.spyOn(useUserStore.getState(), 'fetchUserData').mockResolvedValue();

    const { result } = renderHook(() =>
      useQuizBusinessLogic({
        setToastValue,
        setShowSlideToast,
        showGlobalToast,
        refundStamina,
        recoverStaminaAds,
        handleGameOver,
        totalQuestions: 0,
      })
    );

    await act(async () => {
      await result.current.handleStaminaAdRecovery(setShowStaminaModal);
    });

    expect(recoverStaminaAds).toHaveBeenCalledTimes(1);
    expect(setShowStaminaModal).toHaveBeenCalledWith(false);
    expect(setToastValue).toHaveBeenCalledWith(UI_MESSAGES.STAMINA_RECHARGED_FULL);
    expect(fetchUserDataSpy).toHaveBeenCalled();
  });

  it('handleStaminaAdRecovery: should show failure message when recovery fails', async () => {
    recoverStaminaAds.mockResolvedValue({ success: false, message: '쿨다운 진행 중' });
    const setShowStaminaModal = vi.fn();

    const { result } = renderHook(() =>
      useQuizBusinessLogic({
        setToastValue,
        setShowSlideToast,
        showGlobalToast,
        refundStamina,
        recoverStaminaAds,
        handleGameOver,
        totalQuestions: 0,
      })
    );

    await act(async () => {
      await result.current.handleStaminaAdRecovery(setShowStaminaModal);
    });

    expect(setShowStaminaModal).not.toHaveBeenCalled();
    expect(setToastValue).toHaveBeenCalledWith(UI_MESSAGES.AD_WATCH_FAILED('쿨다운 진행 중'));
  });
});
