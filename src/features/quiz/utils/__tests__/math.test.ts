import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRandomNumber } from '../math';
import { Difficulty } from '@/features/quiz/types/quiz';

// Mock NUMBER_RANGE_BY_DIFFICULTY
vi.mock('../constants/game', () => ({
  NUMBER_RANGE_BY_DIFFICULTY: {
    easy: { min: 0, max: 9 },
    medium: { min: 10, max: 99 },
    hard: { min: 100, max: 999 },
  },
}));

describe('math', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate random number for easy difficulty', () => {
    const result = generateRandomNumber('easy');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(9);
  });

  it('should generate random number for medium difficulty', () => {
    const result = generateRandomNumber('medium');
    expect(result).toBeGreaterThanOrEqual(10);
    expect(result).toBeLessThanOrEqual(99);
  });

  it('should generate random number for hard difficulty', () => {
    const result = generateRandomNumber('hard');
    expect(result).toBeGreaterThanOrEqual(100);
    expect(result).toBeLessThanOrEqual(999);
  });

  it('should fallback to easy for undefined difficulty', () => {
    const result = generateRandomNumber(undefined as unknown as Difficulty);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(9);
  });

  it('should fallback to easy for null difficulty', () => {
    const result = generateRandomNumber(null as unknown as Difficulty);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(9);
  });

  it('should handle boundary values correctly', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = generateRandomNumber('easy');
    expect(result).toBe(0);

    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const result2 = generateRandomNumber('easy');
    expect(result2).toBe(9);
  });
});
