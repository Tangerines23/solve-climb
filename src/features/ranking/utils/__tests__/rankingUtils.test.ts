import { describe, it, expect } from 'vitest';
import {
  formatMedalOrRank,
  formatSeasonBadge,
  buildRankingKey,
  resolveModeParam,
} from '../rankingUtils';
import type { RankingPeriod, RankingType } from '../../types';

describe('formatMedalOrRank', () => {
  it('returns "🥇" for rank 1', () => {
    expect(formatMedalOrRank(1)).toBe('🥇');
  });

  it('returns "🥈" for rank 2', () => {
    expect(formatMedalOrRank(2)).toBe('🥈');
  });

  it('returns "🥉" for rank 3', () => {
    expect(formatMedalOrRank(3)).toBe('🥉');
  });

  it('returns integer rank for rank > 3', () => {
    expect(formatMedalOrRank(4)).toBe(4);
    expect(formatMedalOrRank(10)).toBe(10);
    expect(formatMedalOrRank(100)).toBe(100);
  });

  it('handles floating point rank by flooring', () => {
    expect(formatMedalOrRank(1.2)).toBe('🥇');
    expect(formatMedalOrRank(4.9)).toBe(4);
  });

  it('returns "-" for 0 and negative ranks', () => {
    expect(formatMedalOrRank(0)).toBe('-');
    expect(formatMedalOrRank(-1)).toBe('-');
    expect(formatMedalOrRank(-50)).toBe('-');
  });

  it('returns "-" for NaN, Infinity, -Infinity', () => {
    expect(formatMedalOrRank(NaN)).toBe('-');
    expect(formatMedalOrRank(Infinity)).toBe('-');
    expect(formatMedalOrRank(-Infinity)).toBe('-');
  });

  it('returns "-" for non-number inputs', () => {
    expect(formatMedalOrRank(null)).toBe('-');
    expect(formatMedalOrRank(undefined)).toBe('-');
    expect(formatMedalOrRank('string')).toBe('-');
    expect(formatMedalOrRank({})).toBe('-');
    expect(formatMedalOrRank([])).toBe('-');
  });
});

describe('formatSeasonBadge', () => {
  it('returns formatted Korean season badge for valid ISO date strings', () => {
    expect(formatSeasonBadge('2023-01-15T00:00:00Z')).toMatch(/\d+월 \d+주차 시즌/);
    expect(formatSeasonBadge('2023-12-31T23:59:59Z')).toMatch(/\d+월 \d+주차 시즌/);
  });

  it('returns "시즌 정보 없음" for null, undefined, empty string, non-string', () => {
    expect(formatSeasonBadge(null)).toBe('시즌 정보 없음');
    expect(formatSeasonBadge(undefined)).toBe('시즌 정보 없음');
    expect(formatSeasonBadge('')).toBe('시즌 정보 없음');
    expect(formatSeasonBadge({} as any)).toBe('시즌 정보 없음');
    expect(formatSeasonBadge([] as any)).toBe('시즌 정보 없음');
  });

  it('returns "시즌 정보 없음" for invalid date strings', () => {
    expect(formatSeasonBadge('invalid-date')).toBe('시즌 정보 없음');
    expect(formatSeasonBadge('not-a-date')).toBe('시즌 정보 없음');
  });
});

describe('buildRankingKey', () => {
  it('returns "weekly-total" by default when no arguments are provided', () => {
    expect(buildRankingKey()).toBe('weekly-total');
  });

  it('returns "${period}-${type}" when world/category are omitted', () => {
    expect(buildRankingKey('weekly', 'survival')).toBe('weekly-survival');
    expect(buildRankingKey('all-time', 'total')).toBe('all-time-total');
    expect(buildRankingKey(undefined, undefined)).toBe('weekly-total');
  });

  it('returns "${world}-${category}-${period}-${type}" when world and category are provided', () => {
    expect(buildRankingKey('weekly', 'total', 'world1', 'math')).toBe('world1-math-weekly-total');
  });

  it('trims whitespace from world and category', () => {
    expect(buildRankingKey('weekly', 'total', ' world1 ', ' math ')).toBe(
      'world1-math-weekly-total'
    );
  });

  it('falls back to "${period}-${type}" if world or category is empty string or only whitespace', () => {
    expect(buildRankingKey('weekly', 'total', ' ', 'math')).toBe('weekly-total');
    expect(buildRankingKey('weekly', 'total', 'world1', ' ')).toBe('weekly-total');
    expect(buildRankingKey('weekly', 'total', ' ', ' ')).toBe('weekly-total');
  });
});

describe('resolveModeParam', () => {
  it('returns "time-attack" for "time-attack" (and uppercase/trimmed " TIME-ATTACK ")', () => {
    expect(resolveModeParam('time-attack')).toBe('time-attack');
    expect(resolveModeParam(' TIME-ATTACK ')).toBe('time-attack');
    expect(resolveModeParam('TIME-ATTACK')).toBe('time-attack');
  });

  it('returns "survival" for "survival" (and " Survival ")', () => {
    expect(resolveModeParam('survival')).toBe('survival');
    expect(resolveModeParam(' Survival ')).toBe('survival');
  });

  it('returns "infinite" for "infinite" (and " Infinite ")', () => {
    expect(resolveModeParam('infinite')).toBe('infinite');
    expect(resolveModeParam(' Infinite ')).toBe('infinite');
  });

  it('returns "total" for null, undefined, empty string, or unknown mode strings', () => {
    expect(resolveModeParam(null)).toBe('total');
    expect(resolveModeParam(undefined)).toBe('total');
    expect(resolveModeParam('')).toBe('total');
    expect(resolveModeParam('random')).toBe('total');
    expect(resolveModeParam('invalid')).toBe('total');
  });
});
