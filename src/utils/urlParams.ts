/**
 * URL 파라미터 검증 유틸리티
 * XSS 공격 및 데이터 무결성 보장을 위한 파라미터 검증 함수
 */

/**
 * 숫자 파라미터 검증
 * @param value 검증할 값
 * @param min 최소값 (기본값: 0)
 * @param max 최대값 (기본값: Number.MAX_SAFE_INTEGER)
 * @returns 검증된 숫자 또는 null
 */
/**
 * URL 파라미터 검증 유틸리티
 * Zod를 사용하여 데이터 무결성과 타입 안전성을 보장합니다.
 */

import { z } from 'zod';
import { APP_CONFIG } from '../config/app';
import { createSafeStorageKey } from './storageKey';

/**
 * 숫자 파라미터 검증
 */
export function validateNumberParam(
  value: string | null,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  if (!value) return null;

  const schema = z.coerce.number().min(min).max(max).nullable().catch(null); // 실패 시 null 반환

  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * 부동소수점 파라미터 검증 (validateNumberParam과 동일한 로직 사용)
 */
export function validateFloatParam(
  value: string | null,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  return validateNumberParam(value, min, max);
}

/**
 * 문자열 파라미터 검증 (허용 목록 기반)
 */
export function validateStringParam(
  value: string | null,
  allowedValues: readonly string[]
): string | null {
  if (!value) return null;
  // Zod enum은 튜플을 요구하므로 refine 사용이 더 유연함
  const schema = z.string().refine((val) => allowedValues.includes(val));
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
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
  if (!world || !category) return null;

  // 월드 검증
  const validWorld = validateWorldParam(world);
  if (!validWorld) return null;

  // 카테고리 검증
  return validateCategoryParam(category);
}

/**
 * 서브토픽 파라미터 검증
 */
export function validateSubTopicParam(
  category: string | null,
  subTopic: string | null
): string | null {
  if (!category || !subTopic) return null;

  // 카테고리 검증
  const validCategory = validateCategoryParam(category);
  if (!validCategory) return null;

  // 서브토픽 목록 확인
  const subTopics = APP_CONFIG.SUB_TOPICS[category as keyof typeof APP_CONFIG.SUB_TOPICS];
  if (!subTopics || !Array.isArray(subTopics)) return null;

  const allowedSubTopics = subTopics.map((s) => s.id);
  return validateStringParam(subTopic, allowedSubTopics);
}

/**
 * 게임 모드 파라미터 검증
 */
export function validateModeParam(
  value: string | null
):
  | 'time-attack'
  | 'survival'
  | 'base-camp'
  | 'base-camp-result'
  | 'smart-retry'
  | 'infinite'
  | null {
  // 호환성 처리: time_attack -> time-attack
  const normalizedValue = value === 'time_attack' ? 'time-attack' : value;

  const ModeSchema = z.enum([
    'time-attack',
    'survival',
    'base-camp',
    'base-camp-result',
    'smart-retry',
    'infinite',
  ]);

  const result = ModeSchema.safeParse(normalizedValue);
  return result.success ? result.data : null;
}

/**
 * 레벨 파라미터 검증
 */
export function validateLevelParam(value: string | null, maxLevel: number = 20): number | null {
  return validateNumberParam(value, 1, maxLevel);
}

export { createSafeStorageKey };
