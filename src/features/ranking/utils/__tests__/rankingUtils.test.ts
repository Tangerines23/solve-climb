import { describe, it, expect } from 'vitest';
import {
  formatMedalOrRank,
  formatSeasonBadge,
  buildRankingKey,
  resolveModeParam,
} from '../rankingUtils';

describe('rankingUtils', () => {
  describe('formatMedalOrRank', () => {
    it('returns medal icons for ranks 1, 2, 3', () => {
      expect(formatMedalOrRank(1)).toBe('🥇');
      expect(formatMedalOrRank(2)).toBe('🥈');
      expect(formatMedalOrRank(3)).toBe('🥉');
    });

    it('returns rank number for ranks greater than 3', () => {
      expect(formatMedalOrRank(4)).toBe(4);
      expect(formatMedalOrRank(50)).toBe(50);
      expect(formatMedalOrRank(100)).toBe(100);
    });

    it('returns dash for invalid or non-positive rank numbers', () => {
      expect(formatMedalOrRank(0)).toBe('-');
      expect(formatMedalOrRank(-5)).toBe('-');
      expect(formatMedalOrRank(NaN)).toBe('-');
    });
  });

  describe('formatSeasonBadge', () => {
    it('formats valid ISO date strings correctly into month and week', () => {
      // 2026-09-01 is Tuesday
      const badge = formatSeasonBadge('2026-09-01');
      expect(badge).toContain('9월');
      expect(badge).toContain('주차 시즌');
    });

    it('returns default fallback on undefined or null', () => {
      expect(formatSeasonBadge(undefined)).toBe('시즌 정보 없음');
      expect(formatSeasonBadge(null)).toBe('시즌 정보 없음');
      expect(formatSeasonBadge('')).toBe('시즌 정보 없음');
    });

    it('returns default fallback on invalid date string without throwing or producing NaN', () => {
      expect(formatSeasonBadge('invalid-date')).toBe('시즌 정보 없음');
      expect(formatSeasonBadge('not a date')).toBe('시즌 정보 없음');
    });
  });

  describe('buildRankingKey', () => {
    it('builds standard key when world/category are omitted', () => {
      expect(buildRankingKey('weekly', 'total')).toBe('weekly-total');
      expect(buildRankingKey('all-time', 'survival')).toBe('all-time-survival');
    });

    it('builds compound key when world and category are supplied', () => {
      expect(buildRankingKey('weekly', 'total', 'world-1', 'math')).toBe(
        'world-1-math-weekly-total'
      );
    });

    it('falls back to standard key if only one of world/category is provided', () => {
      expect(buildRankingKey('weekly', 'total', 'world-1', null)).toBe('weekly-total');
      expect(buildRankingKey('weekly', 'total', null, 'math')).toBe('weekly-total');
    });
  });

  describe('resolveModeParam', () => {
    it('resolves valid mode strings', () => {
      expect(resolveModeParam('time-attack')).toBe('time-attack');
      expect(resolveModeParam('survival')).toBe('survival');
      expect(resolveModeParam('total')).toBe('total');
    });

    it('defaults to total for unknown or null params', () => {
      expect(resolveModeParam(null)).toBe('total');
      expect(resolveModeParam('unknown')).toBe('total');
      expect(resolveModeParam('')).toBe('total');
    });
  });
});
