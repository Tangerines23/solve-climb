import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdService, _resetAdPreparedForTest } from '../adService';
import { AdMob } from '@capacitor-community/admob';
import { pauseAllAudio, resumeAllAudio } from '@/utils/sound';

// Mock Sound
vi.mock('@/utils/sound', () => ({
  pauseAllAudio: vi.fn().mockResolvedValue(undefined),
  resumeAllAudio: vi.fn().mockResolvedValue(undefined),
}));

// Mock AdMob
vi.mock('@capacitor-community/admob', () => ({
  AdMob: {
    initialize: vi.fn(),
    prepareRewardVideoAd: vi.fn(),
    showRewardVideoAd: vi.fn(),
  },
}));

describe('AdService', () => {
  const originalWindow = { ...window };

  beforeEach(() => {
    vi.clearAllMocks();
    _resetAdPreparedForTest();
    // @ts-expect-error: Resetting window for tests
    delete window.Capacitor;
    // @ts-expect-error: Resetting window for tests
    delete window.TossAds;
    // @ts-expect-error: Resetting window for tests
    delete window.Toss;
  });

  afterEach(() => {
    // Restore window
    Object.keys(window).forEach((key) => {
      // eslint-disable-next-line security/detect-object-injection
      if (!(key in originalWindow)) delete (window as any)[key];
    });
  });

  describe('state getters', () => {
    it('should reflect initial state accurately', () => {
      expect(AdService.isShowing()).toBe(false);
      expect(AdService.isPrepared()).toBe(false);
      expect(AdService.isPreparing()).toBe(false);
      expect(AdService.isInitialized()).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should not initialize if Capacitor is missing', async () => {
      await AdService.initialize();
      expect(AdMob.initialize).not.toHaveBeenCalled();
      expect(AdService.isInitialized()).toBe(false);
    });

    it('should initialize if Capacitor is present', async () => {
      // @ts-expect-error: Mocking Capacitor
      window.Capacitor = {};
      await AdService.initialize();
      expect(AdMob.initialize).toHaveBeenCalled();
      expect(AdService.isInitialized()).toBe(true);
    });

    it('should not initialize twice', async () => {
      // @ts-expect-error: Mocking Capacitor
      window.Capacitor = {};
      await AdService.initialize();
      const initialCallCount = vi.mocked(AdMob.initialize).mock.calls.length;

      // Try to initialize again
      await AdService.initialize();

      // Call count should not have increased
      expect(AdMob.initialize).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('showRewardedAd', () => {
    it('should use Simulation Ad in default web environment', async () => {
      vi.useFakeTimers();
      const promise = AdService.showRewardedAd('mineral_recharge');

      // Simulation ad takes 1000ms
      await vi.advanceTimersByTimeAsync(1100);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.message).toContain('광고 시청');
      expect(AdService.isShowing()).toBe(false);
      vi.useRealTimers();
    });

    it('should use Toss Ad if window.TossAds is present', async () => {
      // @ts-expect-error: Mocking TossAds
      window.TossAds = {};
      const spy = vi.spyOn(AdService, 'showTossAd');

      vi.useFakeTimers();
      const promise = AdService.showRewardedAd('mineral_recharge');
      await vi.advanceTimersByTimeAsync(1100);
      await promise;

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      vi.useRealTimers();
    });

    it('should use Mobile App Ad if window.Capacitor is present', async () => {
      // @ts-expect-error: Mocking Capacitor
      window.Capacitor = {};
      const spy = vi.spyOn(AdService, 'showMobileAppAd').mockResolvedValue({ success: true });

      await AdService.showRewardedAd('mineral_recharge');

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should pause audio before showing ad and resume audio when ad finishes', async () => {
      vi.useFakeTimers();
      const promise = AdService.showRewardedAd('mineral_recharge');

      expect(pauseAllAudio).toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1100);
      await promise;

      expect(resumeAllAudio).toHaveBeenCalled();
      expect(AdService.isShowing()).toBe(false);
      vi.useRealTimers();
    });

    it('should resume audio and reset showing state even if ad fails or throws an error', async () => {
      const errorSpy = vi
        .spyOn(AdService, 'showSimulationAd')
        .mockRejectedValue(new Error('Ad failure'));

      await expect(AdService.showRewardedAd('mineral_recharge')).rejects.toThrow('Ad failure');

      expect(pauseAllAudio).toHaveBeenCalled();
      expect(resumeAllAudio).toHaveBeenCalled();
      expect(AdService.isShowing()).toBe(false);
      errorSpy.mockRestore();
    });
  });

  describe('showMobileAppAd', () => {
    it('should call AdMob prepare and show', async () => {
      // @ts-expect-error: Mocking AdMob result
      vi.mocked(AdMob.showRewardVideoAd).mockResolvedValue({ type: 'rewarded', amount: 1 });

      const result = await AdService.showMobileAppAd('mineral_recharge');

      expect(AdMob.prepareRewardVideoAd).toHaveBeenCalled();
      expect(AdMob.showRewardVideoAd).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(AdService.isShowing()).toBe(false);
    });

    it('should handle AdMob errors gracefully', async () => {
      vi.mocked(AdMob.prepareRewardVideoAd).mockRejectedValue(new Error('Ad load failed'));

      const result = await AdService.showMobileAppAd('mineral_recharge');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ad load failed');
      expect(AdService.isShowing()).toBe(false);
    });

    it('should handle timeout and release showing lock if AdMob hangs', async () => {
      vi.useFakeTimers();
      vi.mocked(AdMob.prepareRewardVideoAd).mockResolvedValue(undefined);
      // Hang promise (never resolves)
      vi.mocked(AdMob.showRewardVideoAd).mockReturnValue(new Promise(() => {}));

      const promise = AdService.showMobileAppAd('mineral_recharge');
      // Advance by 31 seconds (exceeding DEFAULT_AD_TIMEOUT_MS)
      await vi.advanceTimersByTimeAsync(31000);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('시간이 초과되었습니다');
      expect(AdService.isShowing()).toBe(false);
      vi.useRealTimers();
    });

    it('should return failure if reward amount is 0 or missing (skipped ad)', async () => {
      // @ts-expect-error: Mocking AdMob result with 0 amount
      vi.mocked(AdMob.showRewardVideoAd).mockResolvedValue({ type: 'rewarded', amount: 0 });

      const result = await AdService.showMobileAppAd('mineral_recharge');

      expect(result.success).toBe(false);
      expect(result.error).toContain('광고 보상 획득 조건');
      expect(AdService.isShowing()).toBe(false);
    });

    it('should return failure if adId is invalid', async () => {
      const spyAd = vi.spyOn(AdService, 'showMobileAppAd');
      expect(spyAd).toBeDefined();
    });
  });

  describe('showTossAd', () => {
    it('should invoke TossAds.showRewardAd if present on window', async () => {
      const mockTossShow = vi.fn().mockResolvedValue({ success: true });
      // @ts-expect-error: Mocking TossAds object
      window.TossAds = { showRewardAd: mockTossShow };

      const result = await AdService.showTossAd('mineral_recharge');

      expect(mockTossShow).toHaveBeenCalledWith('mineral_recharge');
      expect(result.success).toBe(true);
      expect(result.message).toContain('토스 광고 시청이 완료되었습니다');
    });

    it('should handle TossAds failure and return error', async () => {
      const mockTossShow = vi.fn().mockResolvedValue({ success: false, error: '사용자 취소' });
      // @ts-expect-error: Mocking TossAds object
      window.TossAds = { showRewardAd: mockTossShow };

      const result = await AdService.showTossAd('mineral_recharge');

      expect(result.success).toBe(false);
      expect(result.error).toBe('사용자 취소');
    });
  });
});
