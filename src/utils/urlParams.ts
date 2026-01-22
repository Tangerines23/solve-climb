/**
 * URL 파라미터 검증 유틸리티
 * XSS 공격 및 데이터 무결성 보장을 위한 파라미터 검증 함수
 */

import { APP_CONFIG } from '../config/app';

/**
 * 숫자 파라미터 검증
 * @param value 검증할 값
 * @param min 최소값 (기본값: 0)
 * @param max 최대값 (기본값: Number.MAX_SAFE_INTEGER)
 * @returns 검증된 숫자 또는 null
 */
export function validateNumberParam(
  value: string | null,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  if (!value) {
    return null;
  }

  const num = parseInt(value, 10);

  // NaN 체크
  if (isNaN(num)) {
    return null;
  }

  // 범위 검증
  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * 부동소수점 파라미터 검증
 * @param value 검증할 값
 * @param min 최소값 (기본값: 0)
 * @param max 최대값 (기본값: Number.MAX_SAFE_INTEGER)
 * @returns 검증된 숫자 또는 null
 */
export function validateFloatParam(
  value: string | null,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  if (!value) {
    return null;
  }

  const num = parseFloat(value);

  // NaN 체크
  if (isNaN(num)) {
    return null;
  }

  // 범위 검증
  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * 문자열 파라미터 검증 (허용 목록 기반)
 * @param value 검증할 값
 * @param allowedValues 허용된 값 목록
 * @returns 검증된 문자열 또는 null
 */
export function validateStringParam(
  value: string | null,
  allowedValues: readonly string[]
): string | null {
  if (!value) {
    return null;
  }

  // 허용 목록에 있는지 확인
  if (allowedValues.includes(value)) {
    return value;
  }

  return null;
}

/**
 * 월드 파라미터 검증
 */
export function validateWorldParam(value: string | null): string | null {
  const allowedWorlds = APP_CONFIG.WORLDS.map((w) => w.id);
  return validateStringParam(value, allowedWorlds);
}

/**
 * 카테고리 파라미터 검증
 */
export function validateCategoryParam(value: string | null): string | null {
  const allowedCategories = APP_CONFIG.CATEGORIES.map((cat) => cat.id);
  return validateStringParam(value, allowedCategories);
}

/**
 * 특정 월드 내의 카테고리 파라미터 검증
 */
export function validateCategoryInWorldParam(
  world: string | null,
  category: string | null
): string | null {
  if (!world || !category) {
    return null;
  }

  // 월드 존재 여부 확인
  const allowedWorlds = APP_CONFIG.WORLDS.map((w) => w.id) as string[];
  if (!allowedWorlds.includes(world)) {
    return null;
  }

  // 카테고리 존재 여부 확인
  const allowedCategories = APP_CONFIG.CATEGORIES.map((cat) => cat.id);
  return validateStringParam(category, allowedCategories);
}

/**
 * 서브토픽 파라미터 검증
 */
export function validateSubTopicParam(
  category: string | null,
  subTopic: string | null
): string | null {
  if (!category || !subTopic) {
    return null;
  }

  // 카테고리가 유효한지 확인
  const allowedCategories = APP_CONFIG.CATEGORIES.map((cat) => cat.id);
  if (!(allowedCategories as string[]).includes(category)) {
    return null;
  }

  // 해당 카테고리의 서브토픽 목록 확인
  const subTopics = APP_CONFIG.SUB_TOPICS[category as keyof typeof APP_CONFIG.SUB_TOPICS];

  if (!subTopics || !Array.isArray(subTopics)) {
    return null;
  }

  const allowedSubTopics = (subTopics as ReadonlyArray<{ id: string }>).map((s) => s.id);
  return validateStringParam(subTopic, allowedSubTopics);
}

/**
 * 게임 모드 파라미터 검증
 */
export function validateModeParam(
  value: string | null
): 'time-attack' | 'survival' | 'base-camp' | 'base-camp-result' | 'smart-retry' | 'infinite' | null {
  if (value === 'time_attack' || value === 'time-attack') {
    return 'time-attack';
  }
  if (value === 'survival') {
    return 'survival';
  }
  if (value === 'base-camp') {
    return 'base-camp';
  }
  if (value === 'base-camp-result') {
    return 'base-camp-result';
  }
  if (value === 'smart-retry') {
    return 'smart-retry';
  }
  if (value === 'infinite') {
    return 'infinite';
  }
  return null;
}

/**
 * 레벨 파라미터 검증
 * @param value 검증할 값
 * @param maxLevel 최대 레벨 (기본값: 20)
 */
export function validateLevelParam(value: string | null, maxLevel: number = 20): number | null {
  return validateNumberParam(value, 1, maxLevel);
}

// createSafeStorageKey는 storageKey.ts에서 export하여 사용
export { createSafeStorageKey } from './storageKey';
