import { useLevelProgressStore, type LevelProgressState } from '../../stores/useLevelProgressStore';
import { useProfileStore, type ProfileState } from '@/stores/useProfileStore';
import { World, Category } from '../../types/quiz';

export function useClimbGraphic(world: World, category: Category) {
  const isLevelCleared = useLevelProgressStore((state: LevelProgressState) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state: LevelProgressState) => state.getNextLevel);
  const isAdmin = useProfileStore((state: ProfileState) => state.isAdmin);

  const nextLevel = getNextLevel(world, category);

  return {
    isLevelCleared: (levelId: number) => isLevelCleared(world, category, levelId),
    nextLevel,
    isAdmin,
  };
}
