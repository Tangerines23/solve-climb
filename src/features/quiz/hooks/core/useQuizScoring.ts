import { useCallback } from 'react';
import { THEME_MULTIPLIERS, BOSS_LEVEL, BOSS_BONUS, ThemeTier } from '@/features/quiz';
import { APP_CONFIG } from '@/config/app';

/**
 * 퀴즈 점수(거리) 계산을 담당하는 훅
 */
export function useQuizScoring() {
  const calculateScore = useCallback(
    (
      currentLevel: number,
      categoryParam: string | null,
      subParam: string | null,
      gameMode: string,
      feverLevel: number,
      isExhausted: boolean
    ) => {
      // 1. 기본 레벨 점수 (Base Score) - v2.2 공식: 레벨 * 10m
      const baseLevelScore = currentLevel * 10;

      // 2. 테마 난이도 배율 (Theme Multiplier)
      const subTopics = APP_CONFIG.SUB_TOPICS as unknown as Record<
        string,
        Array<{ id: string; tier?: ThemeTier }>
      >;
      const categoryTopics =
        categoryParam && Object.prototype.hasOwnProperty.call(subTopics, categoryParam)
          ? (Object.getOwnPropertyDescriptor(subTopics, categoryParam)?.value ?? [])
          : [];
      const currentTopic = categoryTopics.find(
        (t: { id: string; tier?: ThemeTier }) => t.id === subParam
      );
      const tier = (currentTopic as unknown as { tier?: ThemeTier })?.tier || 'basic';

      const themeMultiplier =
        gameMode === 'survival'
          ? 1.0
          : tier === 'basic'
            ? THEME_MULTIPLIERS.basic
            : tier === 'advanced'
              ? THEME_MULTIPLIERS.advanced
              : THEME_MULTIPLIERS.expert;

      // 3. 콤보 배율 (Combo Multiplier)
      const comboMultiplier = feverLevel === 2 ? 1.5 : feverLevel === 1 ? 1.2 : 1.0;

      // 4. 최종 점수 계산
      let earnedDistance = Math.floor(baseLevelScore * themeMultiplier * comboMultiplier);

      // 5. 보스 보너스 (Lv.10) - 타임어택 전용
      if (gameMode !== 'survival' && currentLevel === BOSS_LEVEL) {
        earnedDistance += BOSS_BONUS;
      }

      // 6. 탈진 상태 페널티 (20% 감점, 0.8배 적용)
      if (isExhausted) {
        earnedDistance = Math.floor(earnedDistance * 0.8);
      }

      return earnedDistance;
    },
    []
  );

  return { calculateScore };
}
