import { useCallback } from 'react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useLevelProgressStore } from '@/features/quiz';
import { resetAllData } from '@/utils/dataReset';

/**
 * 데이터 초기화를 위한 브릿지 훅
 */
export function useDataReset() {
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const resetProgress = useLevelProgressStore((state) => state.resetProgress);

  const executeReset = useCallback(async () => {
    return resetAllData(clearProfile, resetProgress);
  }, [clearProfile, resetProgress]);

  return { executeReset };
}
