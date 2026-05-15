// src/utils/math.ts
import { Difficulty } from '../types/quiz';
import { NUMBER_RANGE_BY_DIFFICULTY } from '../constants/game';

/**
 * 난이도에 맞는 범위의 랜덤 정수를 생성합니다.
 * (지시서 6항 - 견고성 1): 예기치 않은 난이도 값(undefined)이 들어올 경우
 * 'easy' 레벨을 기준으로 숫자를 생성합니다. (Fallback 로직)
 */
export const generateRandomNumber = (difficulty: Difficulty): number => {
  const ranges = NUMBER_RANGE_BY_DIFFICULTY as Record<string, { min: number; max: number }>;
  const rangeDesc = Object.getOwnPropertyDescriptor(ranges, difficulty);
  const range = (rangeDesc?.value as { min: number; max: number }) ?? ranges['easy'];

  const { min, max } = range;

  return Math.floor(Math.random() * (max - min + 1)) + min;
};
