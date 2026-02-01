// 점수 계산 유틸리티 함수
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { APP_CONFIG } from '../config/app';
import {
  SCORE_PER_CORRECT,
  BASE_CLIMB_DISTANCE,
  DISTANCE_PER_LEVEL,
  BOSS_LEVEL,
  BOSS_BONUS,
} from '../constants/game';

// 목표 고도 계산 상수 (Deprecated: Now calculated dynamically)
// const METERS_PER_LEVEL = 20 * SCORE_PER_CORRECT; // 200m

/**
 * 전체 누적 등반 고도 계산 (모든 카테고리의 bestScore 합산)
 * @returns 총 고도(m)와 총 문제 수
 */
export function calculateTotalAltitude(): { totalAltitude: number; totalProblems: number } {
  const { progress } = useLevelProgressStore.getState();

  let totalAltitude = 0;

  // 모든 카테고리 순회
  Object.values(progress).forEach((categoryData) => {
    // 모든 서브토픽 순회
    Object.values(categoryData).forEach((subTopicData) => {
      // 모든 레벨 순회
      Object.values(subTopicData).forEach((levelRecord) => {
        // time-attack과 survival 중 최고 점수 선택
        const timeAttack = levelRecord.bestScore['time-attack'] || 0;
        const survival = levelRecord.bestScore['survival'] || 0;
        const bestScore = Math.max(timeAttack, survival);
        totalAltitude += bestScore;
      });
    });
  });

  // 총 문제 수 = 총 고도 / 10m (1문제당 10m)
  const totalProblems = Math.floor(totalAltitude / SCORE_PER_CORRECT);

  return { totalAltitude, totalProblems };
}

/**
 * 특정 서브토픽의 현재 고도 계산
 * @param category 카테고리 ID
 * @param subTopic 서브토픽 ID
 * @returns 현재 고도(m)
 */
export function calculateSubTopicAltitude(category: string, subTopic: string): number {
  const { getLevelProgress } = useLevelProgressStore.getState();
  const levelProgress = getLevelProgress(category, subTopic);

  let currentAltitude = 0;

  levelProgress.forEach((levelRecord) => {
    // time-attack과 survival 중 최고 점수 선택
    const timeAttack = levelRecord.bestScore['time-attack'] || 0;
    const survival = levelRecord.bestScore['survival'] || 0;
    const bestScore = Math.max(timeAttack, survival);
    currentAltitude += bestScore;
  });

  return currentAltitude;
}

/**
 * 특정 서브토픽의 목표 고도 계산
 * @param category 카테고리 ID
 * @param subTopic 서브토픽 ID
 * @returns 목표 고도(m)
 */
export function calculateSubTopicTargetAltitude(category: string, subTopic: string): number {
  const levelsConfig = APP_CONFIG.LEVELS as unknown as Record<
    string,
    Record<string, readonly { level: number }[]>
  >;
  const categoryEntry = Object.entries(levelsConfig).find(([k]) => k === category);
  const worldLevels = categoryEntry
    ? (categoryEntry.at(1) as Record<string, readonly { level: number }[]> | undefined)
    : undefined;
  if (!worldLevels) return 0;

  const subTopicEntry = Object.entries(worldLevels).find(([k]) => k === subTopic);
  const subTopicLevels = subTopicEntry
    ? (subTopicEntry.at(1) as readonly { level: number }[] | undefined)
    : undefined;
  if (!subTopicLevels || !Array.isArray(subTopicLevels)) return 0;

  // 테마 난이도 배율 (Theme Multiplier - 현재는 고정값 1.0 사용하거나 로직 수정 필요)
  const themeMultiplier = 1.0;

  let totalTarget = 0;

  // 각 레벨별 목표 점수를 합산 (레벨당 20문제 기준)
  subTopicLevels.forEach((levelData: { level: number }) => {
    const level = levelData.level;
    const baseLevelScore = BASE_CLIMB_DISTANCE + (level - 1) * DISTANCE_PER_LEVEL;

    // 획득 예상 거리 = (기본거리 * 테마배율) * 20문제
    // (콤보는 변동성이 크므로 목표치 계산에서는 제외하거나 평균값 1.0 적용)
    let levelTargetAltitude = baseLevelScore * themeMultiplier * 20;

    // 보스 보너스 합산
    if (level === BOSS_LEVEL) {
      levelTargetAltitude += BOSS_BONUS;
    }

    totalTarget += levelTargetAltitude;
  });

  return Math.floor(totalTarget);
}

/**
 * 특정 서브토픽의 진행률 계산
 * @param category 카테고리 ID
 * @param subTopic 서브토픽 ID
 * @returns 진행률(%)과 현재/목표 고도
 */
export function calculateSubTopicProgress(
  category: string,
  subTopic: string
): { progressPercent: number; currentAltitude: number; targetAltitude: number } {
  const currentAltitude = calculateSubTopicAltitude(category, subTopic);
  const targetAltitude = calculateSubTopicTargetAltitude(category, subTopic);

  const progressPercent =
    targetAltitude > 0 ? Math.round((currentAltitude / targetAltitude) * 100) : 0;

  return { progressPercent, currentAltitude, targetAltitude };
}

/**
 * 특정 카테고리의 총 누적 고도 계산
 * @param category 카테고리 ID
 * @returns 총 고도(m)와 총 문제 수
 */
export function calculateCategoryAltitude(category: string): {
  totalAltitude: number;
  totalProblems: number;
} {
  const { progress } = useLevelProgressStore.getState();
  const prog = progress as Record<string, unknown>;
  const categoryEntry = Object.entries(prog).find(([k]) => k === category);
  const categoryProgress = categoryEntry?.at(1) as
    | Record<string, Record<string, { bestScore: Record<string, number> }>>
    | undefined;

  if (!categoryProgress) {
    return { totalAltitude: 0, totalProblems: 0 };
  }

  let totalAltitude = 0;

  // 모든 서브토픽 순회
  Object.values(categoryProgress).forEach((levelMap) => {
    // 해당 서브토픽의 모든 레벨 순회
    Object.values(levelMap).forEach((levelRecord) => {
      // time-attack과 survival 중 최고 점수 선택
      const timeAttack = levelRecord.bestScore['time-attack'] || 0;
      const survival = levelRecord.bestScore['survival'] || 0;
      const bestScore = Math.max(timeAttack, survival);
      totalAltitude += bestScore;
    });
  });

  // 총 문제 수 = 총 고도 / 10m
  const totalProblems = Math.floor(totalAltitude / SCORE_PER_CORRECT);

  return { totalAltitude, totalProblems };
}

/**
 * 특정 카테고리의 목표 고도 계산 (모든 월드의 목표 고도 합산)
 * @param category 카테고리 ID
 * @returns 목표 고도(m)
 */
export function calculateCategoryTargetAltitude(category: string): number {
  // 현재는 World1만 지원하므로 World1의 목표 고도 반환
  return calculateSubTopicTargetAltitude('World1', category);
}

/**
 * 특정 카테고리의 진행률 계산
 * @param category 카테고리 ID
 * @returns 진행률(%)과 현재/목표 고도
 */
export function calculateCategoryProgress(category: string): {
  progressPercent: number;
  currentAltitude: number;
  targetAltitude: number;
} {
  const { totalAltitude: currentAltitude } = calculateCategoryAltitude(category);
  const targetAltitude = calculateCategoryTargetAltitude(category);

  const progressPercent =
    targetAltitude > 0 ? Math.round((currentAltitude / targetAltitude) * 100) : 0;

  return { progressPercent, currentAltitude, targetAltitude };
}
