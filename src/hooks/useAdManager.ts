import { useState, useCallback } from 'react';
import { AdService, AdPlacement, AdResult } from '@/utils/adService';

export interface UseAdManagerReturn {
  isAdLoading: boolean;
  preloadAd: () => Promise<boolean>;
  showAd: (placement: AdPlacement) => Promise<AdResult>;
}

/**
 * useAdManager: 광고 호출 및 로딩 UI 상태 관리를 캡슐화하는 커스텀 훅
 */
export function useAdManager(): UseAdManagerReturn {
  const [isAdLoading, setIsAdLoading] = useState(false);

  const preloadAd = useCallback(async () => {
    return await AdService.preloadRewardedAd();
  }, []);

  const showAd = useCallback(async (placement: AdPlacement): Promise<AdResult> => {
    setIsAdLoading(true);
    try {
      const result = await AdService.showRewardedAd(placement);
      return result;
    } finally {
      setIsAdLoading(false);
    }
  }, []);

  return {
    isAdLoading,
    preloadAd,
    showAd,
  };
}
