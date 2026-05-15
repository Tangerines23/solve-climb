import { useQuizStore } from '../../stores/useQuizStore';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useRankingStore } from '../../stores/useRankingStore';
import { useUserStore } from '@/features/auth';
import { useToastStore } from '@/stores/useToastStore';
import { useSettingsStore } from '@/features/mypage';
import { submitScoreToLeaderboard } from '@/utils/tossGameCenter';
import { urls } from '@/utils/navigation';
import { AdService } from '@/utils/adService';
import { supabase } from '@/utils/supabaseClient';
import * as urlParams from '@/utils/urlParams';

/**
 * ResultPageBridge Hook
 *
 * This hook acts as a bridge between the ResultPage UI and the underlying business logic
 * (Stores, Utils, Services). It enforces the architectural boundary that UI components
 * should not directly import from the data or utility layers.
 */
export function useResultPageBridge() {
  // Stores
  // Stores - 개별 Selector 사용으로 리렌더링 최소화
  const storeCategory = useQuizStore((state) => state.category);
  const storeWorld = useQuizStore((state) => state.world);
  const storeLevel = useQuizStore((state) => state.level);
  const storeMode = useQuizStore((state) => state.gameMode);
  const storeScore = useQuizStore((state) => state.score);

  const animationEnabled = useSettingsStore((state) => state.animationEnabled);

  const clearLevel = useLevelProgressStore((state) => state.clearLevel);
  const updateBestScore = useLevelProgressStore((state) => state.updateBestScore);

  const fetchRanking = useRankingStore((state) => state.fetchRanking);
  const rankings = useRankingStore((state) => state.rankings);

  const rewardMinerals = useUserStore((state) => state.rewardMinerals);
  const showToast = useToastStore((state) => state.showToast);

  return {
    // State
    storeCategory,
    storeWorld,
    storeLevel,
    storeMode,
    storeScore,
    animationEnabled,
    rankings,

    // Actions
    clearLevel,
    updateBestScore,
    fetchRanking,
    rewardMinerals,
    showToast,

    // Utils (Wrapped for boundary compliance)
    submitScoreToLeaderboard,
    urls,
    AdService,
    supabase,
    urlParams,
  };
}
