import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuestion } from '../quizGenerator';
import type { Category, Difficulty, World } from '../../types/quiz';

// Mock math utilities
vi.mock('../math', () => ({
  generateRandomNumber: vi.fn((_difficulty: string) => {
    return 10; // Simple constant for testing
  }),
}));

describe('quizGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('World 1: Arithmetic & Algebra', () => {
    it('should generate arithmetic question for World1-기초', () => {
      const result = generateQuestion('World1', '기초', 1, 'easy');
      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('answer');
      expect(typeof result.answer).toBe('number');
    });

    it('should generate equation question for World1-대수', () => {
      const result = generateQuestion('World1', '대수', 10, 'easy');
      expect(result.question).toContain('x');
      expect(typeof result.answer).toBe('number');
    });

    it('should generate calculus question for World1-심화', () => {
      const result = generateQuestion('World1', '심화', 1, 'easy');
      expect(result.question).toMatch(/좌표|derivative|integral|d\/dx|∫/i);
    });
  });

  describe('World 2: Geometry & Space', () => {
    it('should generate geometry question for World2-기초', () => {
      const result = generateQuestion('World2', '기초', 1, 'easy');
      expect(result.question).toMatch(/삼각형|사각형|오각형|육각형|원/);
      expect(typeof result.answer).toBe('number');
    });

    it('should generate symmetry question for World2-논리', () => {
      const result = generateQuestion('World2', '논리', 9, 'easy');
      expect(result.question).toContain('대칭');
    });
  });

  describe('World 3: Probability & Statistics', () => {
    it('should generate stats question for World3-기초', () => {
      const result = generateQuestion('World3', '기초', 1, 'easy');
      expect(result.question).toMatch(/평균|경우의 수/);
    });
  });

  describe('World 4: Engineering & Logic', () => {
    it('should generate binary conversion question for World4-기초', () => {
      const result = generateQuestion('World4', '기초', 1, 'easy');
      expect(result.question).toMatch(/2진수|10진수/);
    });

    it('should generate logic gate question for World4-논리', () => {
      const result = generateQuestion('World4', '논리', 1, 'easy');
      expect(result.question).toMatch(/AND|OR|NOT/);
    });
  });

  describe('Fallback & Error Handling', () => {
    it('should fallback to World 1 for unknown world', () => {
      const result = generateQuestion('UnknownWorld' as unknown as World, '기초', 1, 'easy');
      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('answer');
    });

    it('should handle missing categories with a placeholder', () => {
      const result = generateQuestion('World2', '심화', 1, 'easy');
      expect(result.question).toContain('준비 중');
    });
  });
});
