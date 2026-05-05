import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { World, Category } from '../../types/quiz';

export function useClimbGraphic(world: World, category: Category) {
  const isLevelCleared = useLevelProgressStore((state: any) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state: any) => state.getNextLevel);
  const isAdmin = useProfileStore((state: any) => state.isAdmin);

  const nextLevel = getNextLevel(world, category);

  return {
    isLevelCleared: (levelId: number) => isLevelCleared(world, category, levelId),
    nextLevel,
    isAdmin,
  };
}
