import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { urls } from '@/utils/navigation';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useFeatureFlagStore } from '@/stores/useFeatureFlagStore';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { calculateCategoryAltitude } from '../../utils/scoreCalculator';

export function useCategoryList() {
  const navigate = useNavigate();
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const [showExplorerToast, setShowExplorerToast] = useState<string | null>(null);
  const { flags } = useFeatureFlagStore();
  const progress = useLevelProgressStore((state) => state.progress);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, mountainId: string, mountainName: string) => {
      e.stopPropagation();
      addFavorite({
        type: 'category',
        categoryId: mountainId,
        name: mountainName,
      });
    },
    [addFavorite]
  );

  const handleMountainClick = useCallback(
    (mountainId: string) => {
      navigate(urls.categorySelect({ mountain: mountainId }));
    },
    [navigate]
  );

  const mountains = useMemo(
    () =>
      (
        APP_CONFIG.MOUNTAINS as readonly {
          id: string;
          name: string;
          icon: string;
          disabled: boolean;
          color: string;
        }[]
      ).filter((mountain) => {
        if (mountain.id === 'math') return flags.ENABLE_MATH_MOUNTAIN;
        if (mountain.id === 'language') return flags.ENABLE_LANGUAGE_MOUNTAIN;
        if (mountain.id === 'logic') return flags.ENABLE_LOGIC_MOUNTAIN;
        if (mountain.id === 'general') return flags.ENABLE_GENERAL_MOUNTAIN;
        return true;
      }),
    [flags]
  );

  const getMountainAltitudeInfo = useCallback(
    (mountainId: string) => {
      return calculateCategoryAltitude(mountainId, progress);
    },
    [progress]
  );

  return {
    mountains,
    isFavorite,
    showExplorerToast,
    setShowExplorerToast,
    handleToggleFavorite,
    handleMountainClick,
    getMountainAltitudeInfo,
  };
}
