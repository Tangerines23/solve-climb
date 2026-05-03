import { LevelRecord, UserProgress as CategoryProgressMap } from '../types/progress';
import { APP_CONFIG } from '../config/app';
import {
  SCORE_PER_CORRECT,
  BASE_CLIMB_DISTANCE,
  DISTANCE_PER_LEVEL,
  BOSS_LEVEL,
  BOSS_BONUS,
  GAME_CONFIG,
} from '../constants/game';

/**
 * 레벨 기록에서 최고 점수를 추출합니다. (타임어택, 서바이벌 중 큰 값)
 */
const getBestScore = (record: LevelRecord): number => {
  if (!record?.bestScore) return 0;
  return Math.max(record.bestScore['time-attack'] || 0, record.bestScore.survival || 0);
};

/**
 * 전체 누적 등반 고도 계산 (모든 카테고리의 bestScore 합산)
 * @returns 총 고도(m)와 총 문제 수
 */
export function calculateTotalAltitude(progress: CategoryProgressMap): { totalAltitude: number; totalProblems: number } {
  let totalAltitude = 0;

  // 모든 카테고리 순회
  Object.values(progress).forEach((categoryData) => {
    Object.values(categoryData).forEach((subTopicData) => {
      Object.values(subTopicData).forEach((levelRecord) => {
        totalAltitude += getBestScore(levelRecord);
      });
    });
  });

  const totalProblems = Math.floor(totalAltitude / SCORE_PER_CORRECT);
  return { totalAltitude, totalProblems };
}

/**
 * 특정 서브토픽의 현재 고도 계산
 */
export function calculateSubTopicAltitude(
  category: string,
  subTopic: string,
  progress: CategoryProgressMap
): number {
  const worldProgress = progress[category as keyof typeof progress];
  if (!worldProgress) return 0;

  const subTopicData = worldProgress[subTopic as keyof typeof worldProgress];
  if (!subTopicData) return 0;

  return Object.values(subTopicData).reduce((sum, record) => sum + getBestScore(record), 0);
}

/**
 * 특정 서브토픽의 목표 고도 계산
 */
export function calculateSubTopicTargetAltitude(category: string, subTopic: string): number {
  const levelsConfig = APP_CONFIG.LEVELS as unknown as Record<
    string,
    Record<string, readonly { level: number }[]>
  >;

  // 월드 우선순위: category 파라미터가 월드 ID인 경우 우선, 아니면 World1 검색
  const worldLevels = Object.prototype.hasOwnProperty.call(levelsConfig, category)
    ? levelsConfig[category as keyof typeof levelsConfig]
    : levelsConfig['World1'];

  if (!worldLevels) return 0;

  const subTopicLevels = Object.prototype.hasOwnProperty.call(worldLevels, subTopic)
    ? worldLevels[subTopic as keyof typeof worldLevels]
    : null;

  if (!subTopicLevels || !Array.isArray(subTopicLevels)) return 0;

  const themeMultiplier = 1.0;
  let totalTarget = 0;

  subTopicLevels.forEach((levelData) => {
    const { level } = levelData;
    const baseLevelScore = BASE_CLIMB_DISTANCE + (level - 1) * DISTANCE_PER_LEVEL;
    let levelTargetAltitude = baseLevelScore * themeMultiplier * GAME_CONFIG.PROBLEMS_PER_LEVEL;

    if (level === BOSS_LEVEL) {
      levelTargetAltitude += BOSS_BONUS;
    }
    totalTarget += levelTargetAltitude;
  });

  return Math.floor(totalTarget);
}

/**
 * 특정 서브토픽의 진행률 계산
 */
export function calculateSubTopicProgress(
  category: string,
  subTopic: string,
  progress: CategoryProgressMap
): { progressPercent: number; currentAltitude: number; targetAltitude: number } {
  const currentAltitude = calculateSubTopicAltitude(category, subTopic, progress);
  const targetAltitude = calculateSubTopicTargetAltitude('World1', subTopic);

  const progressPercent =
    targetAltitude > 0 ? Math.round((currentAltitude / targetAltitude) * 100) : 0;

  return { progressPercent, currentAltitude, targetAltitude };
}

/**
 * 특정 카테고리의 총 누적 고도 계산
 */
export function calculateCategoryAltitude(
  category: string,
  progress: CategoryProgressMap
): {
  totalAltitude: number;
  totalProblems: number;
} {
  // 1. 호환성 유지: 만약 category가 progress의 최상위 키(World)라면 해당 World 전체 고도 반환
  if (Object.prototype.hasOwnProperty.call(progress, category)) {
    let totalAltitude = 0;
    const worldProgress = progress[category as keyof typeof progress];
    if (worldProgress) {
      Object.values(worldProgress).forEach((subTopicData) => {
        Object.values(subTopicData).forEach((record) => {
          totalAltitude += getBestScore(record);
        });
      });
    }
    return { totalAltitude, totalProblems: Math.floor(totalAltitude / SCORE_PER_CORRECT) };
  }

  // 2. 일반 케이스: 모든 월드에서 해당 category ID를 찾아 합산
  let totalAltitude = 0;
  Object.values(progress).forEach((worldProgress) => {
    if (Object.prototype.hasOwnProperty.call(worldProgress, category)) {
      const categoryData = worldProgress[category as keyof typeof worldProgress];
      if (categoryData) {
        Object.values(categoryData).forEach((record) => {
          totalAltitude += getBestScore(record);
        });
      }
    }
  });

  const totalProblems = Math.floor(totalAltitude / SCORE_PER_CORRECT);
  return { totalAltitude, totalProblems };
}

/**
 * 특정 카테고리의 목표 고도 계산
 */
export function calculateCategoryTargetAltitude(category: string): number {
  return calculateSubTopicTargetAltitude('World1', category);
}

/**
 * 특정 카테고리의 진행률 계산
 */
export function calculateCategoryProgress(
  category: string,
  progress: CategoryProgressMap
): {
  progressPercent: number;
  currentAltitude: number;
  targetAltitude: number;
} {
  const { totalAltitude: currentAltitude } = calculateCategoryAltitude(category, progress);
  const targetAltitude = calculateCategoryTargetAltitude(category);

  const progressPercent =
    targetAltitude > 0 ? Math.round((currentAltitude / targetAltitude) * 100) : 0;

  return { progressPercent, currentAltitude, targetAltitude };
}

