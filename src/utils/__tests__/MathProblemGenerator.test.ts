import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProblem, STAGES } from '../MathProblemGenerator';

describe('MathProblemGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateProblem', () => {
    it('should generate problem for stage 1', () => {
      const problem = generateProblem(1);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(typeof problem.expression).toBe('string');
      expect(typeof problem.answer).toBe('number');
    });

    it('should generate problem for stage 2', () => {
      const problem = generateProblem(2);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    });

    it('should generate problem for stage 3', () => {
      const problem = generateProblem(3);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should generate problem for stage 4 (carry)', () => {
      const problem = generateProblem(4);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(problem.answer).toBeGreaterThanOrEqual(10);
    });

    it('should generate problem for stage 5 (borrow)', () => {
      const problem = generateProblem(5);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(problem.answer).toBeLessThanOrEqual(9);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    });

    it('should generate problem for stage 7 (multiplication)', () => {
      const problem = generateProblem(7);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(problem.expression).toContain('*');
    });

    it('should generate problem for stage 9 (division)', () => {
      const problem = generateProblem(9);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      // Division might be represented as '/' or '÷'
      expect(problem.expression.includes('/') || problem.expression.includes('÷')).toBe(true);
      // Division should result in integer (or at least finite number)
      expect(Number.isFinite(problem.answer)).toBe(true);
    });

    it('should generate problem for stage 11 (sequential)', () => {
      const problem = generateProblem(11);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should generate problem for stage 14 (fill-blank)', () => {
      const problem = generateProblem(14);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should generate problem for stage 15 (parentheses)', () => {
      const problem = generateProblem(15);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should throw error for invalid stage', () => {
      expect(() => generateProblem(999)).toThrow('Stage 999 not found');
    });

    it('should generate valid problems for all stages', () => {
      STAGES.forEach((stage) => {
        const problem = generateProblem(stage.id);
        expect(problem).toHaveProperty('expression');
        expect(problem).toHaveProperty('answer');
        expect(problem.expression.length).toBeGreaterThan(0);
        expect(typeof problem.answer).toBe('number');
      });
    });

    it('should generate problems with correct answer format', () => {
      const problem = generateProblem(1);
      // Answer should be a valid number
      expect(Number.isFinite(problem.answer)).toBe(true);
    });
  });
});

