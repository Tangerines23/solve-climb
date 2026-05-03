import { useCallback } from 'react';
import { vibrateShort as vibrateShortUtil, vibrateMedium as vibrateMediumUtil, vibrateLong as vibrateLongUtil, vibrateSuccess as vibrateSuccessUtil, vibrateError as vibrateErrorUtil } from '@/utils/haptic';

/**
 * Hook for haptic feedback related operations.
 * Acts as a bridge between UI components and haptic utilities.
 */
export function useHaptic() {
  const vibrateShort = useCallback(() => vibrateShortUtil(), []);
  const vibrateMedium = useCallback(() => vibrateMediumUtil(), []);
  const vibrateLong = useCallback(() => vibrateLongUtil(), []);
  const vibrateSuccess = useCallback(() => vibrateSuccessUtil(), []);
  const vibrateError = useCallback(() => vibrateErrorUtil(), []);

  return {
    vibrateShort,
    vibrateMedium,
    vibrateLong,
    vibrateSuccess,
    vibrateError,
  };
}
