import { useState, useCallback, useMemo } from 'react';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useProfileStore } from '@/features/auth';
import type { Tier } from '../../types/quiz';

// 개발 중인 레벨 목록 (월드_카테고리_레벨 형식)
const UNDER_DEVELOPMENT_LEVELS = new Set<string>([
  // 개발 중인 레벨이 있으면 여기에 추가
]);

export function useLevelList(world: string, category: string, tier: Tier = 'normal') {
  // 해당 월드/카테고리에 속하는 레벨 기록들만 선택적으로 구독
  const relevantRecords = useLevelProgressStore((state) => {
    const prefix = `${tier}:${world}:${category}:`;
    return Object.entries(state.records)
      .filter(([key]) => key.startsWith(prefix))
      .map(([, record]) => record)
      .sort((a, b) => a.level - b.level);
  });

  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const [showUnderDevelopment, setShowUnderDevelopment] = useState(false);

  // relevantRecords가 변경될 때마다(Zustand Selector에 의해) 자동으로 갱신됨
  const nextLevel = useMemo(
    () => getNextLevel(world, category, tier),
    [getNextLevel, world, category, tier, relevantRecords]
  );

  const progress = relevantRecords;

  const isUnderDevelopment = useCallback(
    (level: number) => {
      const levelKey = `${world}_${category}_${level}`;
      return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
    },
    [world, category]
  );

  const getLevelStatus = useCallback(
    (level: number) => {
      // 관리자 모드면 모든 레벨이 해금됨
      if (isAdmin) {
        if (isLevelCleared(world, category, level, tier)) {
          return 'cleared';
        }
        return 'next';
      }

      // 일반 모드
      if (isLevelCleared(world, category, level, tier)) {
        return 'cleared';
      }
      if (level === nextLevel) {
        return 'next';
      }
      if (level > nextLevel) {
        return 'locked';
      }
      return 'next';
    },
    [isAdmin, isLevelCleared, world, category, tier, nextLevel]
  );

  const getBestScore = useCallback(
    (level: number): number | null => {
      const record = progress.find((r: any) => r.level === level);
      if (!record) return null;
      const timeAttack = record.bestScore['time-attack'];
      const survival = record.bestScore['survival'];
      if (timeAttack === null && survival === null) return null;

      // 점수를 그대로 사용 (미터 단위)
      if (timeAttack === null) return survival;
      if (survival === null) return timeAttack;
      return Math.max(timeAttack, survival);
    },
    [progress]
  );

  return {
    isAdmin,
    showUnderDevelopment,
    setShowUnderDevelopment,
    nextLevel,
    isUnderDevelopment,
    getLevelStatus,
    getBestScore,
  };
}
