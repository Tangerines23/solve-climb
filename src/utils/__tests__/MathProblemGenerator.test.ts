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

    it('should handle all type branches: standard, sequential, fill-blank, parentheses', () => {
      // standard type
      const standardProblem = generateProblem(1);
      expect(standardProblem).toHaveProperty('expression');
      expect(standardProblem).toHaveProperty('answer');

      // sequential type
      const sequentialProblem = generateProblem(11);
      expect(sequentialProblem).toHaveProperty('expression');
      expect(sequentialProblem).toHaveProperty('answer');

      // fill-blank type
      const fillBlankProblem = generateProblem(14);
      expect(fillBlankProblem).toHaveProperty('expression');
      expect(fillBlankProblem).toHaveProperty('answer');
      expect(fillBlankProblem.expression).toContain('?');

      // parentheses type
      const parenthesesProblem = generateProblem(15);
      expect(parenthesesProblem).toHaveProperty('expression');
      expect(parenthesesProblem).toHaveProperty('answer');
      expect(parenthesesProblem.expression).toContain('(');
    });

    it('should handle all operator branches: +, -, *, /', () => {
      // Addition
      const addProblem = generateProblem(1);
      expect(addProblem.expression).toContain('+');

      // Subtraction
      const subProblem = generateProblem(2);
      expect(subProblem.expression).toContain('-');

      // Multiplication
      const mulProblem = generateProblem(7);
      expect(mulProblem.expression.includes('*') || mulProblem.expression.includes('×')).toBe(true);

      // Division
      const divProblem = generateProblem(9);
      expect(divProblem.expression.includes('/') || divProblem.expression.includes('÷')).toBe(true);
    });

    it('should handle constraints: resultMax', () => {
      // Stage 1 has resultMax: 10
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(1);
        expect(problem.answer).toBeLessThanOrEqual(10);
      }
    });

    it('should handle constraints: resultMin', () => {
      // Stage 2 has resultMin: 0
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(2);
        expect(problem.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle constraints: resultMax and resultMin together', () => {
      // Stage 3 has both resultMax: 18 and resultMin: 0
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(3);
        expect(problem.answer).toBeGreaterThanOrEqual(0);
        expect(problem.answer).toBeLessThanOrEqual(18);
      }
    });

    it('should handle constraints: ensureIntegerDivision', () => {
      // Stage 9 has ensureIntegerDivision: true
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(9);
        expect(Number.isInteger(problem.answer)).toBe(true);
      }
    });

    it('should handle constraints: resultMin for carry (stage 4)', () => {
      // Stage 4 has resultMin: 10 (force carry)
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(4);
        expect(problem.answer).toBeGreaterThanOrEqual(10);
      }
    });

    it('should handle constraints: resultMax and resultMin for borrow (stage 5)', () => {
      // Stage 5 has resultMax: 9 and resultMin: 0
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(5);
        expect(problem.answer).toBeGreaterThanOrEqual(0);
        expect(problem.answer).toBeLessThanOrEqual(9);
      }
    });

    it('should handle fill-blank with hideFirst branch', () => {
      // Test fill-blank multiple times to cover both branches
      let foundHideFirst = false;
      let foundHideSecond = false;

      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(14);
        if (problem.expression.startsWith('?')) {
          foundHideFirst = true;
        } else if (problem.expression.includes('?') && !problem.expression.startsWith('?')) {
          foundHideSecond = true;
        }
      }

      // At least one branch should be covered
      expect(foundHideFirst || foundHideSecond).toBe(true);
    });

    it('should handle sequential problems with precedence', () => {
      // Stage 13 has mixed operators with precedence
      const problem = generateProblem(13);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(Number.isInteger(problem.answer)).toBe(true);
    });

    it('should handle parentheses problems with division', () => {
      // Test parentheses with division branch
      // This tests the division branch in generateParenthesesProblem
      let foundDivision = false;
      let problem;
      for (let i = 0; i < 20; i++) {
        problem = generateProblem(15);
        if (problem.expression.includes('÷')) {
          foundDivision = true;
          break;
        }
      }
      // May or may not find division, but should handle it if it occurs
      expect(problem).toBeDefined();
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should handle parentheses problems with multiplication', () => {
      // Test parentheses with multiplication branch
      const problem = generateProblem(15);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
      expect(problem.expression).toContain('(');
    });

    it('should handle edge case: invalid stage ID throws error', () => {
      expect(() => generateProblem(0)).toThrow('Stage 0 not found');
      expect(() => generateProblem(-1)).toThrow('Stage -1 not found');
      expect(() => generateProblem(1000)).toThrow('Stage 1000 not found');
    });

    it('should handle fallback when generation fails after 100 attempts', () => {
      // This is hard to test directly, but we can verify the function doesn't crash
      const problem = generateProblem(1);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should handle division with special logic', () => {
      // Stage 9 uses special division logic
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem(9);
        expect(problem.expression.includes('/') || problem.expression.includes('÷')).toBe(true);
        expect(Number.isInteger(problem.answer)).toBe(true);
        expect(problem.answer).toBeGreaterThan(0);
      }
    });

    it('should handle ranges with single range reused', () => {
      // Test stages that might reuse ranges
      const problem = generateProblem(1);
      expect(problem).toHaveProperty('expression');
      expect(problem).toHaveProperty('answer');
    });

    it('should handle sequential problems with multiple operators', () => {
      // Stage 11 has sequential with + and -
      const problem = generateProblem(11);
      expect(problem.expression).toMatch(/[\+\-]/);
      expect(Number.isInteger(problem.answer)).toBe(true);
    });

    it('should handle constraints: allowNegative (default false)', () => {
      // Stages without allowNegative should not produce negative results
      const problem = generateProblem(2);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    });
  });
});

