import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  computeQuizScore,
  useQuizScoring,
  resolveComboMultiplier,
  resolveThemeMultiplier,
  resolveThemeTier,
} from '../useQuizScoring';
import { BOSS_LEVEL, BOSS_BONUS, THEME_MULTIPLIERS } from '@/constants/game';

describe('useQuizScoring & Scoring Rules', () => {
  describe('resolveComboMultiplier', () => {
    it('returns 1.0 for fever level 0', () => {
      expect(resolveComboMultiplier(0)).toBe(1.0);
    });

    it('returns 1.2 for fever level 1', () => {
      expect(resolveComboMultiplier(1)).toBe(1.2);
    });

    it('returns 1.5 for fever level 2', () => {
      expect(resolveComboMultiplier(2)).toBe(1.5);
    });

    it('returns 2.0 for fever level 3', () => {
      expect(resolveComboMultiplier(3)).toBe(2.0);
    });

    it('clamps values > 3 to 2.0', () => {
      expect(resolveComboMultiplier(4)).toBe(2.0);
      expect(resolveComboMultiplier(10)).toBe(2.0);
    });

    it('clamps negative or NaN to 1.0', () => {
      expect(resolveComboMultiplier(-1)).toBe(1.0);
      expect(resolveComboMultiplier(NaN)).toBe(1.0);
    });
  });

  describe('resolveThemeMultiplier', () => {
    it('returns correct multipliers for normal mode', () => {
      expect(resolveThemeMultiplier('basic', 'normal')).toBe(THEME_MULTIPLIERS.basic);
      expect(resolveThemeMultiplier('advanced', 'normal')).toBe(THEME_MULTIPLIERS.advanced);
      expect(resolveThemeMultiplier('expert', 'normal')).toBe(THEME_MULTIPLIERS.expert);
    });

    it('returns 1.0 for all tiers in survival mode', () => {
      expect(resolveThemeMultiplier('basic', 'survival')).toBe(1.0);
      expect(resolveThemeMultiplier('advanced', 'survival')).toBe(1.0);
      expect(resolveThemeMultiplier('expert', 'survival')).toBe(1.0);
    });
  });

  describe('resolveThemeTier', () => {
    it('returns "basic" when categoryParam or subParam is null/empty', () => {
      expect(resolveThemeTier(null, 'sub')).toBe('basic');
      expect(resolveThemeTier('category', null)).toBe('basic');
      expect(resolveThemeTier('', 'sub')).toBe('basic');
      expect(resolveThemeTier('category', '')).toBe('basic');
    });

    it('returns "basic" for unknown category or topic', () => {
      expect(resolveThemeTier('unknownCategory', 'unknownSub')).toBe('basic');
    });
  });

  describe('computeQuizScore (Pure Function)', () => {
    it('returns 10 for basic level 1 with fever 0 and offset 0', () => {
      const params = {
        currentLevel: 1,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 0,
        isExhausted: false,
        randomOffsetOverride: 0,
      };
      expect(computeQuizScore(params)).toBe(10);
    });

    it('doubles score for fever level 3', () => {
      const params = {
        currentLevel: 1,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 3,
        isExhausted: false,
        randomOffsetOverride: 0,
      };
      expect(computeQuizScore(params)).toBe(20);
    });

    it('adds BOSS_BONUS for level 10 in normal mode', () => {
      const params = {
        currentLevel: BOSS_LEVEL,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 0,
        isExhausted: false,
        randomOffsetOverride: 0,
      };
      expect(computeQuizScore(params)).toBe(15 + BOSS_BONUS);
    });

    it('does NOT add BOSS_BONUS for level 10 in survival mode', () => {
      const params = {
        currentLevel: BOSS_LEVEL,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'survival',
        feverLevel: 0,
        isExhausted: false,
        randomOffsetOverride: 0,
      };
      expect(computeQuizScore(params)).toBe(15);
    });

    it('applies 20% penalty for isExhausted', () => {
      const params = {
        currentLevel: 1,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 0,
        isExhausted: true,
        randomOffsetOverride: 0,
      };
      expect(computeQuizScore(params)).toBe(8);
    });

    it('prevents negative score when offset is severely negative', () => {
      const params = {
        currentLevel: 1,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 0,
        isExhausted: false,
        randomOffsetOverride: -100,
      };
      expect(computeQuizScore(params)).toBe(0);
    });

    it('clamps invalid levels (0, negative, NaN) to level 1', () => {
      const baseParams = {
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 0,
        isExhausted: false,
        randomOffsetOverride: 0,
      };
      expect(computeQuizScore({ ...baseParams, currentLevel: 0 })).toBe(10);
      expect(computeQuizScore({ ...baseParams, currentLevel: -5 })).toBe(10);
      expect(computeQuizScore({ ...baseParams, currentLevel: NaN })).toBe(10);
    });
  });

  describe('useQuizScoring (React Hook Wrapper)', () => {
    it('renderHook returns calculateScore function', () => {
      const { result } = renderHook(() => useQuizScoring());
      expect(typeof result.current.calculateScore).toBe('function');
    });

    it('calculateScore produces identical results to computeQuizScore', () => {
      const { result } = renderHook(() => useQuizScoring());
      const params = {
        currentLevel: 1,
        categoryParam: '기초',
        subParam: '기초',
        gameMode: 'normal',
        feverLevel: 0,
        isExhausted: false,
        randomOffsetOverride: 0,
      };
      expect(
        result.current.calculateScore(
          params.currentLevel,
          params.categoryParam,
          params.subParam,
          params.gameMode,
          params.feverLevel,
          params.isExhausted,
          params.randomOffsetOverride
        )
      ).toBe(computeQuizScore(params));
    });
  });
});
