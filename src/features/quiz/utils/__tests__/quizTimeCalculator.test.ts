import { describe, it, expect } from 'vitest';
import { calculateDynamicTimeLimit } from '../quizTimeCalculator';

describe('calculateDynamicTimeLimit', () => {
  // Happy Path: 기본 카테고리, 레벨 1, 문제 0개 풀은 상태
  it('should return baseTime * START pressure for first question at level 1', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '기초',
      questionLevel: 1,
      totalQuestionsAnswered: 0,
    });

    // 기초 maxLevel = 30, normalizedLv = ceil(1/30 * 10) = 1
    // LEVEL_BASE_TIME[1] = 3, PRESSURE_FACTOR.START = 2.0
    // result = 3 * 2.0 = 6
    expect(result).toBe(6);
  });

  // 중간 레벨 테스트
  it('should return correct time for mid-level question', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '기초',
      questionLevel: 15,
      totalQuestionsAnswered: 0,
    });

    // 기초 maxLevel = 30, normalizedLv = ceil(15/30 * 10) = 5
    // LEVEL_BASE_TIME[5] = 10, PRESSURE_FACTOR.START = 2.0
    // result = 10 * 2.0 = 20
    expect(result).toBe(20);
  });

  // 최고 레벨 테스트
  it('should return correct time for max-level question', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '기초',
      questionLevel: 30,
      totalQuestionsAnswered: 0,
    });

    // 기초 maxLevel = 30, normalizedLv = ceil(30/30 * 10) = 10
    // LEVEL_BASE_TIME[10] = 20, PRESSURE_FACTOR.START = 2.0
    // result = 20 * 2.0 = 40
    expect(result).toBe(40);
  });

  // 압박 계수 감소 테스트
  it('should apply pressure decay based on totalQuestionsAnswered', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '기초',
      questionLevel: 1,
      totalQuestionsAnswered: 50,
    });

    // normalizedLv = 1, baseTime = 3
    // pressure = max(0.8, 2.0 - 50 * 0.01) = max(0.8, 1.5) = 1.5
    // result = 3 * 1.5 = 4.5
    expect(result).toBe(4.5);
  });

  // 최소 압박 계수 보장 테스트
  it('should clamp pressure at MIN value', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '기초',
      questionLevel: 1,
      totalQuestionsAnswered: 200,
    });

    // pressure = max(0.8, 2.0 - 200 * 0.01) = max(0.8, 0) = 0.8
    // result = 3 * 0.8 = 2.4
    expect(result).toBeCloseTo(2.4);
  });

  // 다른 카테고리 테스트
  it('should use category-specific maxLevel for normalization', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '논리',
      questionLevel: 15,
      totalQuestionsAnswered: 0,
    });

    // 논리 maxLevel = 15, normalizedLv = ceil(15/15 * 10) = 10
    // LEVEL_BASE_TIME[10] = 20, pressure = 2.0
    // result = 20 * 2.0 = 40
    expect(result).toBe(40);
  });

  // Edge: 알 수 없는 카테고리 → default maxLevel 사용
  it('should use default maxLevel for unknown category', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '알수없는',
      questionLevel: 5,
      totalQuestionsAnswered: 0,
    });

    // default maxLevel = 10, normalizedLv = ceil(5/10 * 10) = 5
    // LEVEL_BASE_TIME[5] = 10, pressure = 2.0
    // result = 10 * 2.0 = 20
    expect(result).toBe(20);
  });

  // Edge: 빈 카테고리 → 기초로 폴백
  it('should fallback to 기초 when category is empty string', () => {
    const result = calculateDynamicTimeLimit({
      questionCategory: '',
      questionLevel: 1,
      totalQuestionsAnswered: 0,
    });

    // '' → '기초', maxLevel = 30, normalizedLv = ceil(1/30*10) = 1
    // baseTime = 3, pressure = 2.0 → 6
    expect(result).toBe(6);
  });
});
