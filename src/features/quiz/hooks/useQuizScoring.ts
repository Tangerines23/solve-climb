import { useCallback } from 'react';
import {
  THEME_MULTIPLIERS,
  FEVER_MULTIPLIERS,
  BOSS_LEVEL,
  BOSS_BONUS,
  ThemeTier,
} from '@/constants/game';
import { APP_CONFIG } from '@/config/app';
import { getBaseLevelScore } from '../utils/scoreCalculator';

const BASIC_CATEGORY_OFFSETS = [-2, -1, 0, 1, 1, 2, 2, 3];

export interface QuizScoreParams {
  currentLevel: number;
  categoryParam: string | null;
  subParam: string | null;
  gameMode: string;
  feverLevel: number;
  isExhausted: boolean;
  randomOffsetOverride?: number;
}

/**
 * 테마 티어 안전 해석 함수 (Object Calisthenics: Zero Else, Guard Clauses)
 */
export function resolveThemeTier(categoryParam: string | null, subParam: string | null): ThemeTier {
  if (!categoryParam || !subParam) {
    return 'basic';
  }

  const subTopicsMap = new Map<
    string,
    ReadonlyArray<{ readonly id: string; readonly tier?: ThemeTier }>
  >(
    Object.entries(
      (APP_CONFIG.SUB_TOPICS || {}) as unknown as Record<
        string,
        ReadonlyArray<{ readonly id: string; readonly tier?: ThemeTier }>
      >
    )
  );

  const categoryTopics = subTopicsMap.get(categoryParam) || [];
  const matchedTopic = categoryTopics.find((t) => t.id === subParam);

  return matchedTopic?.tier || 'basic';
}

/**
 * 콤보/피버 배율 계산 함수 (0 ~ 3 단계 안전 클램핑)
 */
export function resolveComboMultiplier(feverLevel: number): number {
  const safeLevel = Math.min(3, Math.max(0, Math.floor(feverLevel || 0)));
  switch (safeLevel) {
    case 3:
      return FEVER_MULTIPLIERS[3];
    case 2:
      return FEVER_MULTIPLIERS[2];
    case 1:
      return FEVER_MULTIPLIERS[1];
    default:
      return FEVER_MULTIPLIERS[0];
  }
}

/**
 * 테마 배율 계산 (서바이벌 모드는 고정 1.0)
 */
export function resolveThemeMultiplier(tier: ThemeTier, gameMode: string): number {
  if (gameMode === 'survival') {
    return 1.0;
  }
  switch (tier) {
    case 'expert':
      return THEME_MULTIPLIERS.expert;
    case 'advanced':
      return THEME_MULTIPLIERS.advanced;
    default:
      return THEME_MULTIPLIERS.basic;
  }
}

/**
 * 퀴즈 점수(거리) 계산 순수 함수
 * - React 종속성 없이 외부 시뮬레이터/서비스에서도 직접 호출 가능
 * - 음수 점수 및 레벨 경계값 불변식 방어
 */
export function computeQuizScore({
  currentLevel,
  categoryParam,
  subParam,
  gameMode,
  feverLevel,
  isExhausted,
  randomOffsetOverride,
}: QuizScoreParams): number {
  const safeLevel = Math.max(1, Math.floor(currentLevel || 1));

  // 1. 기본 레벨 점수 (Base Score) - 5레벨 계단식 점수 공식 적용
  const categoryIdForScore = categoryParam === '기초' || subParam === '기초' ? '기초' : subParam;
  let baseLevelScore = getBaseLevelScore(safeLevel, categoryIdForScore);

  // '기초' 분야의 경우 +-n 랜덤 오프셋 (양수 편향: 평균 +0.75m) 적용
  if (categoryIdForScore === '기초') {
    const offset =
      randomOffsetOverride !== undefined
        ? randomOffsetOverride
        : BASIC_CATEGORY_OFFSETS[Math.floor(Math.random() * BASIC_CATEGORY_OFFSETS.length)];
    baseLevelScore += offset;
  }

  // 2. 테마 난이도 배율 (Theme Multiplier)
  const tier = resolveThemeTier(categoryParam, subParam);
  const themeMultiplier = resolveThemeMultiplier(tier, gameMode);

  // 3. 콤보 배율 (Combo Multiplier: 0: 1.0x, 1: 1.2x, 2: 1.5x, 3: 2.0x)
  const comboMultiplier = resolveComboMultiplier(feverLevel);

  // 4. 최종 점수 계산
  let earnedDistance = Math.floor(baseLevelScore * themeMultiplier * comboMultiplier);

  // 5. 보스 보너스 (Lv.10) - 타임어택 전용
  if (gameMode !== 'survival' && safeLevel === BOSS_LEVEL) {
    earnedDistance += BOSS_BONUS;
  }

  // 6. 탈진 상태 페널티 (20% 감점, 0.8배 적용)
  if (isExhausted) {
    earnedDistance = Math.floor(earnedDistance * 0.8);
  }

  // 음수 점수 원천 방어 (최소 0 보장)
  return Math.max(0, earnedDistance);
}

/**
 * 퀴즈 점수(거리) 계산을 담당하는 훅 (computeQuizScore의 React 래퍼)
 */
export function useQuizScoring() {
  const calculateScore = useCallback(
    (
      currentLevel: number,
      categoryParam: string | null,
      subParam: string | null,
      gameMode: string,
      feverLevel: number,
      isExhausted: boolean,
      randomOffsetOverride?: number
    ) =>
      computeQuizScore({
        currentLevel,
        categoryParam,
        subParam,
        gameMode,
        feverLevel,
        isExhausted,
        randomOffsetOverride,
      }),
    []
  );

  return { calculateScore };
}
