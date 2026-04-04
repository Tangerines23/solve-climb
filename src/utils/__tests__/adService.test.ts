import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdService } from '../adService';
import { AdMob } from '@capacitor-community/admob';

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

  describe('initialize', () => {
    it('should not initialize if Capacitor is missing', async () => {
      await AdService.initialize();
      expect(AdMob.initialize).not.toHaveBeenCalled();
    });

    it('should initialize if Capacitor is present', async () => {
      // @ts-expect-error: Mocking Capacitor
      window.Capacitor = {};
      await AdService.initialize();
      expect(AdMob.initialize).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      // @ts-expect-error: Mocking Capacitor
      window.Capacitor = {};
      // Ensure it's initialized at least once
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

      // Simulation ad takes 2000ms
      await vi.advanceTimersByTimeAsync(2100);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.message).toContain('광고 시청');
      vi.useRealTimers();
    });

    it('should use Toss Ad if window.TossAds is present', async () => {
      // @ts-expect-error: Mocking TossAds
      window.TossAds = {};
      const spy = vi.spyOn(AdService, 'showTossAd');

      vi.useFakeTimers();
      const promise = AdService.showRewardedAd('mineral_recharge');
      await vi.advanceTimersByTimeAsync(2100);
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
  });

  describe('showMobileAppAd', () => {
    it('should call AdMob prepare and show', async () => {
      // @ts-expect-error: Mocking AdMob result
      vi.mocked(AdMob.showRewardVideoAd).mockResolvedValue({ type: 'rewarded', amount: 1 });

      const result = await AdService.showMobileAppAd('mineral_recharge');

      expect(AdMob.prepareRewardVideoAd).toHaveBeenCalled();
      expect(AdMob.showRewardVideoAd).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle AdMob errors gracefully', async () => {
      vi.mocked(AdMob.prepareRewardVideoAd).mockRejectedValue(new Error('Ad load failed'));

      const result = await AdService.showMobileAppAd('mineral_recharge');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ad load failed');
    });
  });
});
