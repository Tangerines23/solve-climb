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

export const AdService = {
  /**
   * AdMob 초기화
   */
  async initialize(): Promise<void> {
    // @ts-expect-error: Capacitor window object
    if (isAdMobInitialized || !window.Capacitor) return;
    try {
      await AdMob.initialize({
        // @ts-expect-error: AdMob initialize options
        requestTrackingAuthorization: true,
        testingDevices: [
          /* '2077ef9a63d2b398840261cdd3d3a4b3' */
        ],
        initializeForTesting: ENV.IS_DEVELOPMENT,
      });
      isAdMobInitialized = true;
      console.log('[AdService] AdMob Initialized');
    } catch (e) {
      console.error('[AdService] AdMob initialization failed', e);
    }
  },

  /**
   * 보상형 광고를 호출합니다.
   * @param placement 광고 노출 위치 (분석 및 분기용)
   * @returns 광고 시청 결과
   */
  async showRewardedAd(placement: AdPlacement): Promise<AdResult> {
    console.log(`[AdService] Showing rewarded ad for placement: ${placement}`);

    // 1. 토스 인앱 환경 감지
    // @ts-expect-error: TossAds window object
    if (window.TossAds || window.Toss) {
      return await this.showTossAd(placement);
    }

    // 2. 모바일 앱 환경 감지 (Capacitor)
    // @ts-expect-error: Capacitor window object
    if (window.Capacitor) {
      await this.initialize();
      return await this.showMobileAppAd(placement);
    }

    // 3. 기본/개발/심사 환경 (Vercel 포함)
    return await this.showSimulationAd(placement);
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
    const adId = ENV.ADMOB_REWARDED_ID;
    console.log(`[AdService] Attempting to show AdMob Rewarded Ad: ${adId}`);

    try {
      const options: RewardAdOptions = {
        adId: adId,
        // npa: true, // 비개인화 광고 여부
      };

      await AdMob.prepareRewardVideoAd(options);
      const reward = await AdMob.showRewardVideoAd();

      console.log('[AdService] Reward earned:', reward);
      return {
        success: true,
        message: '광고 시청이 완료되었습니다.',
      };
    } catch (error: any) {
      console.error('[AdService] AdMob Error:', error);
      // 에러 시 시뮬레이션으로 Fallback 할지, 사용자에게 알릴지 결정
      // 여기서는 실제 환경이므로 실패 처리가 정석이나,
      // UX를 위해 안내 메시지와 함께 리턴합니다.
      return {
        success: false,
        error: error.message || '광고를 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  /**
   * 광고 시뮬레이션 (개발/심사 환경용)
   */
  async showSimulationAd(_placement: AdPlacement): Promise<AdResult> {
    const isVercel = ENV.IS_VERCEL;
    const duration = isVercel ? 1500 : 2000; // 심사 환경에서는 약간 더 빠르게

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
