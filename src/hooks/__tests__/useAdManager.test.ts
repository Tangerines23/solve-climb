import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdManager } from '../useAdManager';
import { AdService } from '@/utils/adService';

vi.mock('@/utils/adService', () => ({
  AdService: {
    preloadRewardedAd: vi.fn().mockResolvedValue(true),
    showRewardedAd: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('useAdManager custom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should manage loading state during showAd', async () => {
    const { result } = renderHook(() => useAdManager());

    expect(result.current.isAdLoading).toBe(false);

    let res: any;
    await act(async () => {
      res = await result.current.showAd('stamina_recharge');
    });

    expect(res.success).toBe(true);
    expect(result.current.isAdLoading).toBe(false);
    expect(AdService.showRewardedAd).toHaveBeenCalledWith('stamina_recharge');
  });

  it('should call preloadAd successfully', async () => {
    const { result } = renderHook(() => useAdManager());

    let preloaded: boolean;
    await act(async () => {
      preloaded = await result.current.preloadAd();
    });

    expect(preloaded!).toBe(true);
    expect(AdService.preloadRewardedAd).toHaveBeenCalled();
  });
});
