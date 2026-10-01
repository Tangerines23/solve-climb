import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useQuizScoring,
  resolveComboMultiplier,
  resolveThemeMultiplier,
  resolveThemeTier,
} from '../useQuizScoring';
import { BOSS_LEVEL, BOSS_BONUS } from '@/constants/game';

describe('useQuizScoring & Scoring Rules', () => {
  describe('resolveComboMultiplier', () => {
    it('should return 1.0 for fever level 0', () => {
      expect(resolveComboMultiplier(0)).toBe(1.0);
    });

    it('should return 1.2 for fever level 1', () => {
      expect(resolveComboMultiplier(1)).toBe(1.2);
    });

    it('should return 1.5 for fever level 2', () => {
      expect(resolveComboMultiplier(2)).toBe(1.5);
    });

    it('should return 2.0 for fever level 3 (Super/Max Fever)', () => {
      // 핵심 버그 수정 검증: 기존에는 feverLevel 3이 1.0으로 떨어지는 버그가 있었음
      expect(resolveComboMultiplier(3)).toBe(2.0);
    });

    it('should safely clamp values above 3 to 2.0', () => {
      expect(resolveComboMultiplier(4)).toBe(2.0);
      expect(resolveComboMultiplier(10)).toBe(2.0);
    });

    it('should safely clamp negative or invalid values to 1.0', () => {
      expect(resolveComboMultiplier(-1)).toBe(1.0);
      expect(resolveComboMultiplier(NaN)).toBe(1.0);
    });
  });

  describe('resolveThemeMultiplier', () => {
    it('should return correct multipliers in normal mode', () => {
      expect(resolveThemeMultiplier('basic', 'normal')).toBe(1.0);
      expect(resolveThemeMultiplier('advanced', 'normal')).toBe(1.5);
      expect(resolveThemeMultiplier('expert', 'normal')).toBe(3.0);
    });

    it('should return 1.0 for all tiers in survival mode', () => {
      expect(resolveThemeMultiplier('basic', 'survival')).toBe(1.0);
      expect(resolveThemeMultiplier('advanced', 'survival')).toBe(1.0);
      expect(resolveThemeMultiplier('expert', 'survival')).toBe(1.0);
    });
  });

  describe('resolveThemeTier', () => {
    it('should default to basic when parameters are missing', () => {
      expect(resolveThemeTier(null, null)).toBe('basic');
      expect(resolveThemeTier('수학', null)).toBe('basic');
      expect(resolveThemeTier(null, 'World1')).toBe('basic');
    });

    it('should return basic for unknown category or topic', () => {
      expect(resolveThemeTier('존재하지않음', '알수없음')).toBe('basic');
    });
  });

  describe('calculateScore', () => {
    it('should calculate standard score at level 1 with fever 0', () => {
      const { result } = renderHook(() => useQuizScoring());
      // 기초 레벨 1 (Base: 10) + offset 0 -> 10m * 1.0 (theme) * 1.0 (fever) = 10m
      const score = result.current.calculateScore(
        1,
        '기초',
        'World1',
        'normal',
        0,
        false,
        0 // offset override
      );
      expect(score).toBe(10);
    });

    it('should apply 2.0x multiplier when fever level is 3', () => {
      const { result } = renderHook(() => useQuizScoring());
      // Non-basic category to avoid random offset (e.g. 대수 Level 1 base = 10)
      // 10 * 1.0 (basic tier) * 2.0 (fever 3) = 20m
      const score = result.current.calculateScore(1, '대수', 'unknown_sub', 'normal', 3, false);
      expect(score).toBe(20);
    });

    it('should apply boss bonus on level 10 in normal mode', () => {
      const { result } = renderHook(() => useQuizScoring());
      // Level 10 base score + boss bonus (50)
      const scoreNormal = result.current.calculateScore(
        BOSS_LEVEL,
        '대수',
        'unknown_sub',
        'normal',
        0,
        false
      );
      // In survival mode, boss bonus should NOT be applied
      const scoreSurvival = result.current.calculateScore(
        BOSS_LEVEL,
        '대수',
        'unknown_sub',
        'survival',
        0,
        false
      );

      expect(scoreNormal).toBeGreaterThan(scoreSurvival);
      expect(scoreNormal - scoreSurvival).toBe(BOSS_BONUS);
    });

    it('should apply 20% penalty (0.8x) when exhausted', () => {
      const { result } = renderHook(() => useQuizScoring());
      const scoreNormal = result.current.calculateScore(
        1,
        '대수',
        'unknown_sub',
        'normal',
        0,
        false
      );
      const scoreExhausted = result.current.calculateScore(
        1,
        '대수',
        'unknown_sub',
        'normal',
        0,
        true // isExhausted
      );

      expect(scoreExhausted).toBe(Math.floor(scoreNormal * 0.8));
    });
  });
});
