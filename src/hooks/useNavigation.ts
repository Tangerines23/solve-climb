import { useMemo } from 'react';
import { urls as urlUtils } from '@/utils/navigation';

/**
 * Hook for navigation related operations.
 * Acts as a bridge between UI components and navigation utilities.
 */
export function useNavigation() {
  const urls = useMemo(() => urlUtils, []);

  return {
    urls,
  };
}
