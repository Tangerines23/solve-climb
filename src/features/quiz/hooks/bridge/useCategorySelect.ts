import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { urls } from '@/utils/navigation';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { storageService, STORAGE_KEYS } from '@/services';
import { useNavigationContext } from '@/hooks/useNavigationContext';

export function useCategorySelect() {
  const navigate = useNavigate();
  const { mountain: mountainParam, mountainName, tryRecover } = useNavigationContext();

  // [Phase 8] Persistence & Self-healing - 파라미터가 없을 때 스토리지에서 복구 시도
  useEffect(() => {
    tryRecover(['mountain']);
  }, [tryRecover]);

  const progressStore = useLevelProgressStore();
  const bypassLevelLock = useDebugStore((state) => state.bypassLevelLock);
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const addFavorite = useFavoriteStore((state) => state.addFavorite);

  const handleToggleFavorite = useCallback((e: React.MouseEvent, categoryId: string, categoryName: string) => {
    e.preventDefault();
    e.stopPropagation();
    addFavorite({
      type: 'subcategory',
      categoryId,
      name: categoryName,
    });
  }, [addFavorite]);

  const lastWorld = mountainParam ? 
    (storageService.get<string>(STORAGE_KEYS.LAST_PLAYED_WORLD(mountainParam as string)) ||
    (mountainParam === 'language' ? 'LangWorld1' : 'World1')) : '';

  const getCategoryProgress = useCallback((world: string, categoryId: string) => {
    const levels = APP_CONFIG.LEVELS[world as keyof typeof APP_CONFIG.LEVELS] as unknown as Record<
      string,
      readonly unknown[]
    >;
    const categoryEntry = levels && Object.entries(levels).find(([k]) => k === categoryId);
    const categoryLevels = categoryEntry ? categoryEntry[1] : undefined;
    const totalLevels = categoryLevels?.length || 0;
    if (totalLevels === 0) return 0;

    const clearedLevels = progressStore
      .getLevelProgress(world, categoryId)
      .filter((l) => l.cleared).length;
    return Math.round((clearedLevels / totalLevels) * 100);
  }, [progressStore]);

  const handleCategoryClick = useCallback((categoryId: string, isLocked: boolean) => {
    if (isLocked || !mountainParam) return;
    navigate(
      urls.levelSelect({
        mountain: mountainParam,
        world: lastWorld,
        category: categoryId,
      })
    );
  }, [mountainParam, lastWorld, navigate]);

  const categories = mountainParam ? 
    APP_CONFIG.CATEGORIES.filter((c) => c.mountainId === mountainParam) : [];

  return {
    mountainParam,
    mountainName,
    categories,
    lastWorld,
    bypassLevelLock,
    isFavorite,
    handleToggleFavorite,
    handleCategoryClick,
    getCategoryProgress,
    navigate,
    urls,
  };
}
