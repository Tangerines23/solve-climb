import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { World, Tier } from '@/features/quiz/types/quiz';
import { urls } from '@/utils/navigation';
import { storageService, STORAGE_KEYS } from '@/services';
import { useNavigationContext } from '@/hooks/useNavigationContext';

/**
 * Bridge hook for LevelSelectPage.
 * Encapsulates store interactions, utility functions, and complex logic.
 */
export function useLevelSelectPageBridge() {
  const navigate = useNavigate();
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [tier] = useState<Tier>('normal'); // FIXME: 복구 시 로직 추가
  const lastLongPressRef = useRef(0);

  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite);

  const {
    mountain: mountainParam,
    world: worldParam,
    category: categoryParam,
    tryRecover,
  } = useNavigationContext();

  // [Phase 8] Persistence & Self-healing
  useEffect(() => {
    tryRecover(['mountain', 'world', 'category']);
  }, [tryRecover]);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  // Derived data
  const worldInfo = APP_CONFIG.WORLDS.find((w) => w.id === worldParam);
  const worldName =
    worldInfo?.name ||
    (worldParam
      ? (APP_CONFIG.WORLD_MAP[worldParam as keyof typeof APP_CONFIG.WORLD_MAP] as string)
      : '');
  const categoryInfo = APP_CONFIG.CATEGORIES.find((cat) => cat.id === categoryParam);

  const worldLevels = worldParam
    ? (APP_CONFIG.LEVELS[worldParam as keyof typeof APP_CONFIG.LEVELS] as unknown as Record<
        string,
        { level: number; name: string; description: string }[]
      >)
    : null;
  const levelsEntry = worldLevels && Object.entries(worldLevels).find(([k]) => k === categoryParam);
  const levels = levelsEntry ? levelsEntry[1] : undefined;
  const categoryColor = categoryInfo?.color || 'var(--color-teal-500)';

  // Handlers
  const handleLevelClick = useCallback(
    (level: number) => {
      if (!mountainParam || !worldParam || !categoryParam) return;
      navigate(
        urls.quiz({
          mountain: mountainParam,
          world: worldParam,
          category: categoryParam,
          level,
          mode: 'time-attack',
          tier,
        })
      );
    },
    [navigate, mountainParam, worldParam, categoryParam, tier]
  );

  const handleLockedLevelClick = useCallback((_level: number, nextLevel: number) => {
    setToastMessage(`Level ${nextLevel}의 문제 10문제를 맞추고 와야 해요`);
    setShowToast(true);
  }, []);

  const handleLevelLongPress = useCallback(
    (_level: number) => {
      const now = Date.now();
      if (now - lastLongPressRef.current < 3000) return;
      lastLongPressRef.current = now;

      if (!categoryParam) return;
      const alreadyFav = isFavorite(categoryParam);
      addFavorite({
        type: 'subcategory',
        categoryId: categoryParam,
        name: categoryInfo?.name ?? categoryParam,
      });
      setToastMessage(alreadyFav ? '즐겨찾기 해제됨' : '⭐ 즐겨찾기에 추가됨');
      setShowToast(true);
    },
    [isFavorite, addFavorite, categoryParam, categoryInfo]
  );

  const handleSurvivalClick = useCallback(() => {
    if (!mountainParam || !worldParam || !categoryParam) return;
    navigate(
      urls.quiz({
        mountain: mountainParam,
        world: worldParam,
        category: categoryParam,
        level: 1,
        mode: 'survival',
        tier,
      })
    );
  }, [navigate, mountainParam, worldParam, categoryParam, tier]);

  const handleWorldChange = useCallback(
    (direction: 'next' | 'prev') => {
      if (!mountainParam || !worldParam || !categoryParam) return;
      const validWorldIds = APP_CONFIG.WORLDS.filter((w) => w.mountainId === mountainParam).map(
        (w) => w.id
      );
      if (validWorldIds.length <= 1) return;

      const currentIndex = validWorldIds.indexOf(worldParam as World);
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= validWorldIds.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = validWorldIds.length - 1;

      const nextWorld = validWorldIds.at(nextIndex) ?? validWorldIds[0];
      storageService.set(STORAGE_KEYS.LAST_PLAYED_WORLD(mountainParam), nextWorld);
      navigate(
        urls.levelSelect({
          mountain: mountainParam,
          world: nextWorld,
          category: categoryParam,
        })
      );
    },
    [navigate, mountainParam, worldParam, categoryParam]
  );

  const handleBack = useCallback(() => {
    if (mountainParam) {
      navigate(urls.categorySelect({ mountain: mountainParam }));
    }
  }, [navigate, mountainParam]);

  const handleHomeRedirect = useCallback(() => {
    navigate(urls.home(), { replace: true });
  }, [navigate]);

  const handleCategorySelectRedirect = useCallback(() => {
    if (mountainParam) {
      navigate(urls.categorySelect({ mountain: mountainParam }), { replace: true });
    } else {
      handleHomeRedirect();
    }
  }, [navigate, mountainParam, handleHomeRedirect]);

  return {
    mountainParam,
    worldParam,
    categoryParam,
    worldInfo,
    worldName,
    categoryInfo,
    categoryColor,
    levels,
    tier,
    isReady,
    isSheetExpanded,
    setIsSheetExpanded,
    toastMessage,
    showToast,
    setShowToast,
    handleLevelClick,
    handleLockedLevelClick,
    handleLevelLongPress,
    handleSurvivalClick,
    handleWorldChange,
    handleBack,
    handleHomeRedirect,
    handleCategorySelectRedirect,
    setToastMessage,
  };
}
