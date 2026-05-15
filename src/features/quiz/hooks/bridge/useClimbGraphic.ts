import { useLevelProgressStore, type LevelProgressState } from '../../stores/useLevelProgressStore';
import { useProfileStore, type ProfileState } from '@/features/auth';
import { World, Category } from '../../types/quiz';

export function useClimbGraphic(world: World, category: Category) {
  const nextLevel = useLevelProgressStore((state: LevelProgressState) =>
    state.getNextLevel(world, category)
  );
  const isAdmin = useProfileStore((state: ProfileState) => state.isAdmin);
  const isLevelCleared = useLevelProgressStore((state: LevelProgressState) => state.isLevelCleared);

  return {
    isLevelCleared: (levelId: number) => isLevelCleared(world, category, levelId),
    nextLevel,
    isAdmin,
  };
}
