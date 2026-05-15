import { useCallback } from 'react';
import { useProfileStore } from '../stores/useProfileStore';
import { useLevelProgressStore } from '@/features/quiz';
import { performUserWithdraw } from '../utils/userWithdraw';

/**
 * 회원 탈퇴를 위한 브릿지 훅
 */
export function useUserWithdraw() {
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const resetProgress = useLevelProgressStore((state) => state.resetProgress);

  const executeWithdraw = useCallback(async () => {
    return performUserWithdraw(clearProfile, resetProgress);
  }, [clearProfile, resetProgress]);

  return { executeWithdraw };
}
