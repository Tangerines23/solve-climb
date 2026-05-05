import { useQuizStore } from '../../stores/useQuizStore';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useUserStore } from '@/stores/useUserStore';
import { useToastStore } from '@/stores/useToastStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
  const {
    category: storeCategory,
    world: storeWorld,
    level: storeLevel,
    gameMode: storeMode,
    score: storeScore,
  } = useQuizStore();

  const { animationEnabled } = useSettingsStore();
  const { clearLevel, updateBestScore, fetchRanking, rankings } = useLevelProgressStore();
  const { rewardMinerals } = useUserStore();
  const { showToast } = useToastStore();

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
