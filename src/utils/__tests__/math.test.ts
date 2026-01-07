import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRandomNumber } from '../math';
import { Difficulty } from '../types/quiz';

// Mock NUMBER_RANGE_BY_DIFFICULTY
vi.mock('../constants/game', () => ({
  NUMBER_RANGE_BY_DIFFICULTY: {
    easy: { min: 1, max: 10 },
    medium: { min: 10, max: 100 },
    hard: { min: 100, max: 1000 },
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
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('should generate random number for medium difficulty', () => {
    const result = generateRandomNumber('medium');
    expect(result).toBeGreaterThanOrEqual(10);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should generate random number for hard difficulty', () => {
    const result = generateRandomNumber('hard');
    expect(result).toBeGreaterThanOrEqual(100);
    expect(result).toBeLessThanOrEqual(1000);
  });

  it('should fallback to easy for undefined difficulty', () => {
    const result = generateRandomNumber(undefined as unknown as Difficulty);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
  });
});
