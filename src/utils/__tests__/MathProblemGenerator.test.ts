import { describe, it, expect } from 'vitest';
import { generateProblem, STAGES, type StageConfig } from '../MathProblemGenerator';

describe('MathProblemGenerator', () => {
  const mockRng = {
    random: () => 0.5,
    randomInt: (min: number, _max: number) => min, // Always return min for stability in ops/ranges
  };

  describe('generateProblem', () => {
    it('should generate a valid problem for stage 1 (standard)', () => {
      const problem = generateProblem(1, 'easy', 'normal', mockRng);
      expect(problem.expression).toBe('1 + 1');
      expect(problem.answer).toBe(2);
      expect(problem.inputType).toBe('number');
    });

    it('should generate a valid problem for stage 5 (sequential)', () => {
      const problem = generateProblem(5, 'medium', 'normal', mockRng);
      // nums: [1, 1, 1], ops: [+] (since randomInt(0,2) returns 0)
      expect(problem.expression).toBe('1 + 1 + 1');
      expect(problem.answer).toBe(3);
    });

    it('should generate a valid problem for stage 7 (division)', () => {
      // Division logic ignores rng for quotient (uses 2-9)
      const problem = generateProblem(7, 'easy', 'normal', mockRng);
      expect(problem.expression).toContain('÷');
      expect(problem.answer).toBeGreaterThan(0);
    });

    it('should generate a valid problem for stage 10 (mixed sequential)', () => {
      const problem = generateProblem(10, 'medium', 'normal', mockRng);
      // nums: [1, 1, 1], ops: [+]
      expect(problem.expression).toBe('1 + 1 + 1');
      expect(problem.answer).toBe(3);
    });

    it('should generate a valid problem for stage 16 (parentheses)', () => {
      const problem = generateProblem(16, 'medium', 'normal', mockRng);
      expect(problem.expression).toContain('(');
      expect(problem.expression).toContain(')');
      expect(Number.isInteger(problem.answer)).toBe(true);
    });

    it('should generate a valid problem for stage 18 (modulo)', () => {
      const problem = generateProblem(18, 'medium', 'normal', mockRng);
      expect(problem.expression).toContain('나머지');
      expect(problem.answer).toBeLessThan(7);
    });

    it('should generate a valid problem for stage 19 (fill-blank)', () => {
      const problem = generateProblem(19, 'medium', 'normal', mockRng);
      expect(problem.expression).toContain('□');
      expect(problem.answer).toBeGreaterThan(0);
    });

    it('should generate a valid problem for stage 21 (decimal)', () => {
      const problem = generateProblem(21, 'hard', 'normal', mockRng);
      expect(problem.expression).toMatch(/\d\.\d/);
      expect(problem.inputType).toBe('decimal');
    });

    it('should generate a valid problem for stage 24 (fraction)', () => {
      const problem = generateProblem(24, 'hard', 'normal', mockRng);
      expect(problem.expression).toContain('/');
      expect(problem.inputType).toBe('fraction');
    });

    it('should throw error for non-existent stage', () => {
      expect(() => generateProblem(999, 'easy')).toThrow('Stage 999 not found');
    });

    it('should use fallback when generation fails 100 times', () => {
      // Stub STAGES[0].type to something that will throw in generation
      const originalType = STAGES[0].type;
      (STAGES[0] as unknown as { type: string }).type = 'invalid';

      const problem = generateProblem(1, 'easy', 'normal', mockRng);
      expect(problem.expression).toBe('1 + 1');
      expect(problem.answer).toBe(2);

      STAGES[0].type = originalType;
    });

    it('should handle hard tier (AlgebraAdvanced)', () => {
      const problem = generateProblem(1, 'hard', 'hard', mockRng);
      expect(problem.expression).toBeDefined();
      expect(problem.inputType).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle division with integer division constraint in sequential', () => {
      // Stage 10 has ensureIntegerDivision: true
      const problem = generateProblem(10, 'medium', 'normal');
      expect(Number.isInteger(problem.answer)).toBe(true);
    });

    it('should handle time problems', () => {
      const timeStage: StageConfig = {
        id: 99,
        world: 9,
        description: 'Time Test',
        type: 'time',
        operators: ['+'],
        operandCount: 2,
        ranges: [
          { min: 1, max: 23 },
          { min: 10, max: 120 },
        ],
      };

      STAGES.push(timeStage);

      const problem = generateProblem(99, 'easy', 'normal', mockRng);
      expect(problem.expression).toContain('분');
      expect(problem.expression).toContain(':');

      STAGES.pop();
    });
  });
});
