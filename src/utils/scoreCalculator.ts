// 점수 계산 유틸리티 함수
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { APP_CONFIG } from '../config/app';
import { SCORE_PER_CORRECT } from '../constants/game';

// 목표 고도 계산 상수
// 각 레벨당 20문제 × 10m = 200m
const METERS_PER_LEVEL = 20 * SCORE_PER_CORRECT; // 200m

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
  const levels = APP_CONFIG.LEVELS[category as keyof typeof APP_CONFIG.LEVELS];
  if (!levels) return 0;

  const subTopicLevels = levels[subTopic as keyof typeof levels];
  if (!subTopicLevels || !Array.isArray(subTopicLevels)) return 0;

  // 레벨 수 × 200m (20문제 × 10m)
  return subTopicLevels.length * METERS_PER_LEVEL;
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

  const progressPercent = targetAltitude > 0 
    ? Math.round((currentAltitude / targetAltitude) * 100)
    : 0;

  return { progressPercent, currentAltitude, targetAltitude };
}

/**
 * 특정 카테고리의 총 누적 고도 계산
 * @param category 카테고리 ID
 * @returns 총 고도(m)와 총 문제 수
 */
export function calculateCategoryAltitude(category: string): { totalAltitude: number; totalProblems: number } {
  const { progress } = useLevelProgressStore.getState();
  const categoryProgress = progress[category];
  
  if (!categoryProgress) {
    return { totalAltitude: 0, totalProblems: 0 };
  }

  let totalAltitude = 0;

  // 모든 서브토픽 순회
  Object.values(categoryProgress).forEach((subTopicData) => {
    // 모든 레벨 순회
    Object.values(subTopicData).forEach((levelRecord) => {
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
 * 특정 카테고리의 목표 고도 계산 (모든 서브토픽의 목표 고도 합산)
 * @param category 카테고리 ID
 * @returns 목표 고도(m)
 */
export function calculateCategoryTargetAltitude(category: string): number {
  const topics = APP_CONFIG.SUB_TOPICS[category as keyof typeof APP_CONFIG.SUB_TOPICS];
  if (!topics) return 0;

  let totalTargetAltitude = 0;

  topics.forEach((topic) => {
    const targetAltitude = calculateSubTopicTargetAltitude(category, topic.id);
    totalTargetAltitude += targetAltitude;
  });

  return totalTargetAltitude;
}

/**
 * 특정 카테고리의 진행률 계산
 * @param category 카테고리 ID
 * @returns 진행률(%)과 현재/목표 고도
 */
export function calculateCategoryProgress(
  category: string
): { progressPercent: number; currentAltitude: number; targetAltitude: number } {
  const { totalAltitude: currentAltitude } = calculateCategoryAltitude(category);
  const targetAltitude = calculateCategoryTargetAltitude(category);

  const progressPercent = targetAltitude > 0 
    ? Math.round((currentAltitude / targetAltitude) * 100)
    : 0;

  return { progressPercent, currentAltitude, targetAltitude };
}

