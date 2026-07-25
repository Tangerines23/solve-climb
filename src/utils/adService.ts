/**
 * AdService: 광고 플랫폼 통합 인터페이스
 * 토스, 버셀(웹), 앱(구글/애플) 환경에 따라 적절한 광고를 호출합니다.
 */

import { AdMob, RewardAdOptions } from '@capacitor-community/admob';
import { ENV } from './env';

export type AdPlacement = 'revive' | 'mineral_recharge' | 'double_reward' | 'stamina_recharge';

export interface AdResult {
  success: boolean;
  message?: string;
  error?: string;
}

let isAdMobInitialized = false;
let isAdPrepared = false;
let isPreparingAd = false;
let isShowingAd = false;

export function _resetAdPreparedForTest(): void {
  isAdMobInitialized = false;
  isAdPrepared = false;
  isPreparingAd = false;
  isShowingAd = false;
}

export const AdService = {
  /**
   * AdMob 초기화
   */
  async initialize(): Promise<void> {
    const win =
      typeof window !== 'undefined' ? (window as unknown as { Capacitor?: unknown }) : undefined;
    if (isAdMobInitialized || !win?.Capacitor) return;
    try {
      await AdMob.initialize({
        // @ts-expect-error: AdMob initialize options
        requestTrackingAuthorization: true,
        testingDevices: [],
        initializeForTesting: import.meta.env.DEV,
      });
      isAdMobInitialized = true;
      console.log('[AdService] AdMob Initialized');

      // 초기화 후 백그라운드에서 첫 리워드 광고 사전 준비(Preload)
      this.preloadRewardedAd().catch((err) => {
        console.warn('[AdService] Initial preload warning:', err);
      });
    } catch (e) {
      console.error('[AdService] AdMob initialization failed', e);
    }
  },

  /**
   * 리워드 광고 사전 준비 (Preload)
   * 백그라운드에서 미디어를 다운로드하여 버튼 클릭 시 대기 시간 0초를 보장합니다.
   */
  async preloadRewardedAd(): Promise<boolean> {
    const win =
      typeof window !== 'undefined' ? (window as unknown as { Capacitor?: unknown }) : undefined;
    if (!win?.Capacitor || isAdPrepared || isPreparingAd) return isAdPrepared;

    isPreparingAd = true;
    try {
      await this.initialize();
      const adId = ENV.VITE_ADMOB_REWARDED_ID;
      const options: RewardAdOptions = {
        adId: String(adId),
      };
      console.log('[AdService] Preloading AdMob Rewarded Ad in background...');
      await AdMob.prepareRewardVideoAd(options);
      isAdPrepared = true;
      console.log('[AdService] AdMob Rewarded Ad Preloaded Successfully!');
      return true;
    } catch (err) {
      console.warn('[AdService] Preloading failed:', err);
      isAdPrepared = false;
      return false;
    } finally {
      isPreparingAd = false;
    }
  },

  /**
   * 보상형 광고를 호출합니다.
   * @param placement 광고 노출 위치 (분석 및 분기용)
   * @returns 광고 시청 결과
   */
  async showRewardedAd(placement: AdPlacement): Promise<AdResult> {
    if (isShowingAd) {
      console.warn('[AdService] Ad is already showing. Request ignored.');
      return {
        success: false,
        error: '이미 광고가 재생 중입니다.',
      };
    }

    console.log(`[AdService] Showing rewarded ad for placement: ${placement}`);
    isShowingAd = true;

    try {
      const win =
        typeof window !== 'undefined'
          ? (window as unknown as { TossAds?: unknown; Toss?: unknown; Capacitor?: unknown })
          : undefined;

      // 1. 토스 인앱 환경 감지
      if (win?.TossAds || win?.Toss) {
        return await this.showTossAd(placement);
      }

      // 2. 모바일 앱 환경 감지 (Capacitor)
      if (win?.Capacitor) {
        return await this.showMobileAppAd(placement);
      }

      // 3. 기본/개발/심사 환경 (Vercel 포함)
      return await this.showSimulationAd(placement);
    } finally {
      isShowingAd = false;
    }
  },

  /**
   * 토스 전용 광고 호출 (Placeholder)
   */
  async showTossAd(_placement: AdPlacement): Promise<AdResult> {
    console.log('[AdService] Attempting to show Toss Ad');
    return await this.showSimulationAd(_placement);
  },

  /**
   * 모바일 앱 전용 광고 호출 (AdMob)
   */
  async showMobileAppAd(_placement: AdPlacement): Promise<AdResult> {
    const adId = ENV.VITE_ADMOB_REWARDED_ID;
    console.log(`[AdService] Attempting to show AdMob Rewarded Ad: ${adId}`);

    try {
      // 1. 사전 준비(Preload) 확인 및 수동 준비
      if (!isAdPrepared) {
        console.log('[AdService] Ad not preloaded, preparing now...');
        const options: RewardAdOptions = {
          adId: String(adId),
        };
        await AdMob.prepareRewardVideoAd(options);
      }

      // 준비 상태 소비
      isAdPrepared = false;

      // 2. 광고 재생
      const reward = await AdMob.showRewardVideoAd();
      console.log('[AdService] Reward earned:', reward);

      // 3. 시청 완료 후 다음 광고를 백그라운드에서 즉시 사전 로드(Preload)
      setTimeout(() => {
        this.preloadRewardedAd().catch(() => {});
      }, 1000);

      return {
        success: true,
        message: '광고 시청이 완료되었습니다.',
      };
    } catch (error: unknown) {
      console.error('[AdService] AdMob Error:', error);
      isAdPrepared = false;

      // 에러 발생 시 다음 기회를 위해 사전 로드 재시도
      setTimeout(() => {
        this.preloadRewardedAd().catch(() => {});
      }, 3000);

      return {
        success: false,
        error:
          (error instanceof Error ? error.message : String(error)) ||
          '광고를 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  /**
   * 광고 시뮬레이션 (개발/심사 환경용)
   */
  async showSimulationAd(_placement: AdPlacement): Promise<AdResult> {
    const duration = 1000; // 빠른 개발 테스트를 위해 1초로 단축

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '광고 시청을 완료했습니다! 보상이 지급됩니다. 📺',
        });
      }, duration);
    });
  },
};
