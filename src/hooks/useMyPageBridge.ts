import { useProfileStore } from '../stores/useProfileStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { useQuizStore } from '../stores/useQuizStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useMyPageStats } from './useMyPageStats';
import { useDataReset } from './useDataReset';
import { useUserWithdraw } from './useUserWithdraw';
import { urls } from '../utils/navigation';
import { getTodayChallenge } from '../utils/challenge';
import { vibrateShort } from '../utils/haptic';
import { signInWithGoogle } from '../utils/auth';
import { handleTossLogin, isTossAppEnvironment } from '../utils/tossLogin';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { useFeatureFlagStore } from '../stores/useFeatureFlagStore';
import { storageService, STORAGE_KEYS } from '../services';

/**
 * MyPageBridge Hook
 * 
 * This hook acts as a bridge between the MyPage UI and the underlying business logic
 * (Stores, Utils, Services). It enforces the architectural boundary that UI components
 * should not directly import from the data or utility layers.
 */
export function useMyPageBridge() {
  // Stats & Sessions
  const statsResult = useMyPageStats();
  
  // Stores
  const profile = useProfileStore((state) => state.profile);
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const setProfile = useProfileStore((state) => state.setProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const isAdmin = useProfileStore((state) => state.isAdmin);

  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled);
  const animationEnabled = useSettingsStore((state) => state.animationEnabled);
  const setAnimationEnabled = useSettingsStore((state) => state.setAnimationEnabled);

  const favorites = useFavoriteStore((state) => state.favorites);
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const progressMap = useLevelProgressStore((state) => state.progress);
  const flags = useFeatureFlagStore((state) => state.flags);

  // Helpers
  const getLastPlayedWorld = (mountainId: string) => {
    return storageService.get<string>(STORAGE_KEYS.LAST_PLAYED_WORLD(mountainId)) || 'World1';
  };

  // Business Logic Hooks
  const { executeReset } = useDataReset();
  const { executeWithdraw } = useUserWithdraw();

  return {
    // Data
    profile,
    isProfileComplete,
    isAdmin,
    hapticEnabled,
    animationEnabled,
    favorites,
    progressMap,
    flags,
    ...statsResult, // stats, session, loading, error, refetch

    // Actions
    setProfile,
    clearProfile,
    setHapticEnabled,
    setAnimationEnabled,
    setCategoryTopic,
    executeReset,
    executeWithdraw,
    
    // Helpers
    getLastPlayedWorld,
    
    // Utils (Wrapped for boundary compliance)
    getTodayChallenge,
    vibrateShort,
    signInWithGoogle,
    handleTossLogin,
    isTossAppEnvironment,
    urls,
    
    // Supabase (Wrapped for boundary compliance)
    supabase,
    safeSupabaseQuery,
  };
}
