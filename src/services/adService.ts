/**
 * AdService: 광고 플랫폼 통합 인터페이스
 * 토스, 버셀(웹), 앱(구글/애플) 환경에 따라 적절한 광고를 호출합니다.
 */

import { AdMob, RewardAdOptions } from '@capacitor-community/admob';
import { ENV } from '@/utils/env';
import { pauseAllAudio, resumeAllAudio } from '@/utils/sound';

export type AdPlacement = 'revive' | 'mineral_recharge' | 'double_reward' | 'stamina_recharge';

export interface AdResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface WindowWithAds {
  Capacitor?: unknown;
  TossAds?: unknown;
  Toss?: unknown;
}

let isAdMobInitialized = false;
let isAdPrepared = false;
let isPreparingAd = false;
let isShowingAd = false;

const DEFAULT_AD_TIMEOUT_MS = 30000;
const PRELOAD_TIMEOUT_MS = 15000;

/**
 * 프로미스에 안전 타임아웃을 적용하는 헬퍼 함수 (무한 대기 방어)
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
  });
}

function getWindowAds(): WindowWithAds | undefined {
  if (typeof window === 'undefined') return undefined;
  return window as unknown as WindowWithAds;
}

const activeTimers = new Set<ReturnType<typeof setTimeout>>();

function safeScheduleAdTask(fn: () => void, delayMs: number): ReturnType<typeof setTimeout> {
  const timer = setTimeout(() => {
    activeTimers.delete(timer);
    fn();
  }, delayMs);
  activeTimers.add(timer);
  return timer;
}

export function clearPendingAdTimers(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();
}

function getValidAdId(): string | null {
  const adId = ENV.VITE_ADMOB_REWARDED_ID;
  if (!adId || typeof adId !== 'string' || adId.trim() === '' || adId === 'undefined') {
    return null;
  }
  return adId.trim();
}

export function _resetAdPreparedForTest(): void {
  clearPendingAdTimers();
  isAdMobInitialized = false;
  isAdPrepared = false;
  isPreparingAd = false;
  isShowingAd = false;
}

export const AdService = {
  /**
   * 광고 상태 조회용 게터
   */
  isShowing(): boolean {
    return isShowingAd;
  },

  isPrepared(): boolean {
    return isAdPrepared;
  },

  isPreparing(): boolean {
    return isPreparingAd;
  },

  isInitialized(): boolean {
    return isAdMobInitialized;
  },

  /**
   * AdMob 초기화
   */
  async initialize(): Promise<void> {
    const win = getWindowAds();
    if (isAdMobInitialized) return;
    if (!win?.Capacitor) return;

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
    const win = getWindowAds();
    if (!win?.Capacitor) return isAdPrepared;
    if (isAdPrepared) return true;
    if (isPreparingAd) return false;

    const adId = getValidAdId();
    if (!adId) {
      console.warn('[AdService] Missing or invalid AdMob Rewarded ID');
      return false;
    }

    isPreparingAd = true;
    try {
      await this.initialize();
      const options: RewardAdOptions = {
        adId,
      };
      console.log('[AdService] Preloading AdMob Rewarded Ad in background...');
      await withTimeout(
        AdMob.prepareRewardVideoAd(options),
        PRELOAD_TIMEOUT_MS,
        'Ad preload timed out'
      );
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

    // 광고 재생 전 게임 BGM 및 WebAudio 안전 일시정지 (광고 오디오 간섭 및 중복 재생 방지)
    await pauseAllAudio().catch((err) => {
      console.warn('[AdService] pauseAllAudio failed before ad:', err);
    });

    try {
      const win = getWindowAds();

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
      // 광고 시청 종료(완료/취소/실패) 후 게임 오디오 정상 복원
      await resumeAllAudio().catch((err) => {
        console.warn('[AdService] resumeAllAudio failed after ad:', err);
      });
    }
  },

  /**
   * 토스 전용 광고 호출 (Placeholder)
   */
  async showTossAd(_placement: AdPlacement): Promise<AdResult> {
    console.log('[AdService] Attempting to show Toss Ad');
    const win = getWindowAds();
    const tossAdsObj = win?.TossAds as
      { showRewardAd?: (p: string) => Promise<{ success: boolean; error?: string }> } | undefined;
    if (typeof tossAdsObj?.showRewardAd === 'function') {
      try {
        const res = await tossAdsObj.showRewardAd(_placement);
        if (res?.success) {
          return { success: true, message: '토스 광고 시청이 완료되었습니다.' };
        }
        return { success: false, error: res?.error || '토스 광고 시청에 실패했습니다.' };
      } catch (err) {
        console.warn('[AdService] TossAds native call failed, falling back:', err);
      }
    }
    return await this.showSimulationAd(_placement);
  },

  /**
   * 모바일 앱 전용 광고 호출 (AdMob)
   */
  async showMobileAppAd(_placement: AdPlacement): Promise<AdResult> {
    const adId = getValidAdId();
    if (!adId) {
      return {
        success: false,
        error: '광고 단위 ID가 설정되지 않았습니다.',
      };
    }
    console.log(`[AdService] Attempting to show AdMob Rewarded Ad: ${adId}`);

    try {
      // 1. 사전 준비(Preload) 확인 및 수동 준비
      if (!isAdPrepared) {
        console.log('[AdService] Ad not preloaded, preparing now...');
        const options: RewardAdOptions = {
          adId,
        };
        await withTimeout(
          AdMob.prepareRewardVideoAd(options),
          PRELOAD_TIMEOUT_MS,
          '광고 준비 시간이 초과되었습니다.'
        );
      }

      // 준비 상태 소비
      isAdPrepared = false;

      // 2. 광고 재생 (타임아웃 가드로 무한 대기 락 방지)
      const reward = await withTimeout(
        AdMob.showRewardVideoAd(),
        DEFAULT_AD_TIMEOUT_MS,
        '광고 재생 응답 시간이 초과되었습니다.'
      );
      console.log('[AdService] Reward earned:', reward);

      // 보상 무결성 가드: 스킵 및 부정 시청 방어
      if (!reward || (typeof reward.amount === 'number' && reward.amount <= 0)) {
        return {
          success: false,
          error: '광고 보상 획득 조건을 만족하지 못했습니다.',
        };
      }

      // 3. 시청 완료 후 다음 광고를 백그라운드에서 즉시 사전 로드(Preload)
      safeScheduleAdTask(() => {
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
      safeScheduleAdTask(() => {
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
