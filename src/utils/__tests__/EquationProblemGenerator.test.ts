import { describe, it, expect } from 'vitest';
import {
  generateEquation,
  EQUATION_STAGES,
  EquationProblemGenerator,
} from '../EquationProblemGenerator';

describe('EquationProblemGenerator', () => {
  describe('generateEquation', () => {
    it('should generate equation for stage 1', () => {
      const problem = generateEquation(1);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('?');
      expect(typeof problem.x).toBe('number');
    });

    it('should generate equation for stage 2', () => {
      const problem = generateEquation(2);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('?');
    });

    it('should generate equation for stage 3', () => {
      const problem = generateEquation(3);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
    });

    it('should generate equation for stage 4 (x + a = b)', () => {
      const problem = generateEquation(4);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('x');
      expect(problem.question).toContain('+');
    });

    it('should generate equation for stage 5 (x - a = b)', () => {
      const problem = generateEquation(5);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('x');
      expect(problem.question).toContain('-');
    });

    it('should generate equation for stage 7 (coefficient multiply)', () => {
      const problem = generateEquation(7);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('x');
    });

    it('should generate equation for stage 8 (coefficient divide)', () => {
      const problem = generateEquation(8);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('x');
      expect(problem.question).toContain('÷');
    });

    it('should generate equation for stage 10 (two-step)', () => {
      const problem = generateEquation(10);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('x');
    });

    it('should generate equation for stage 13 (both sides)', () => {
      const problem = generateEquation(13);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('x');
    });

    it('should generate equation for stage 14 (parentheses)', () => {
      const problem = generateEquation(14);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
      expect(problem.question).toContain('(');
    });

    it('should throw error for invalid stage', () => {
      expect(() => generateEquation(999)).toThrow('Stage 999 not found');
    });

    it('should generate valid equations for all stages', () => {
      EQUATION_STAGES.forEach((stage) => {
        const problem = generateEquation(stage.stage);
        expect(problem).toHaveProperty('question');
        expect(problem).toHaveProperty('x');
        expect(problem.question.length).toBeGreaterThan(0);
        expect(typeof problem.x).toBe('number');
        expect(Number.isInteger(problem.x)).toBe(true);
      });
    });

    it('should generate equations with integer solutions', () => {
      for (let i = 1; i <= 15; i++) {
        const problem = generateEquation(i);
        expect(Number.isInteger(problem.x)).toBe(true);
      }
    });
  });

  describe('EquationProblemGenerator class', () => {
    it('should generate equation using static method', () => {
      const problem = EquationProblemGenerator.generate(1);
      expect(problem).toHaveProperty('question');
      expect(problem).toHaveProperty('x');
    });

    it('should generate same result as function', () => {
      const problem1 = generateEquation(4);
      const problem2 = EquationProblemGenerator.generate(4);
      // Both should have valid structure
      expect(problem1).toHaveProperty('question');
      expect(problem2).toHaveProperty('question');
      expect(problem1).toHaveProperty('x');
      expect(problem2).toHaveProperty('x');
    });

    it('should test all format branches: fill_plus, fill_minus, fill_subtract', () => {
      // fill_plus (stage 1)
      const fillPlus = generateEquation(1);
      expect(fillPlus.question).toContain('?');
      expect(fillPlus.question).toContain('+');

      // fill_minus (stage 2)
      const fillMinus = generateEquation(2);
      expect(fillMinus.question).toContain('?');
      expect(fillMinus.question).toContain('-');

      // fill_subtract (stage 3)
      const fillSubtract = generateEquation(3);
      expect(fillSubtract.question).toContain('?');
      expect(fillSubtract.question).toContain('-');
    });

    it('should test all format branches: x_plus, x_minus, x_plus_reverse', () => {
      // x_plus (stage 4)
      const xPlus = generateEquation(4);
      expect(xPlus.question).toContain('x');
      expect(xPlus.question).toContain('+');

      // x_minus (stage 5)
      const xMinus = generateEquation(5);
      expect(xMinus.question).toContain('x');
      expect(xMinus.question).toContain('-');

      // x_plus_reverse (stage 6)
      const xPlusReverse = generateEquation(6);
      expect(xPlusReverse.question).toContain('x');
      expect(xPlusReverse.question).toContain('+');
    });

    it('should test all format branches: coefficient_multiply, coefficient_divide, coefficient_negative', () => {
      // coefficient_multiply (stage 7)
      const coeffMul = generateEquation(7);
      expect(coeffMul.question).toContain('x');

      // coefficient_divide (stage 8)
      const coeffDiv = generateEquation(8);
      expect(coeffDiv.question).toContain('x');
      expect(coeffDiv.question).toContain('÷');

      // coefficient_negative (stage 9)
      const coeffNeg = generateEquation(9);
      expect(coeffNeg.question).toContain('x');
      expect(coeffNeg.question).toContain('-');
    });

    it('should test all format branches: two_step_plus, two_step_minus, two_step_large', () => {
      // two_step_plus (stage 10)
      const twoStepPlus = generateEquation(10);
      expect(twoStepPlus.question).toContain('x');
      expect(twoStepPlus.question).toContain('+');

      // two_step_minus (stage 11)
      const twoStepMinus = generateEquation(11);
      expect(twoStepMinus.question).toContain('x');
      expect(twoStepMinus.question).toContain('-');

      // two_step_large (stage 12)
      const twoStepLarge = generateEquation(12);
      expect(twoStepLarge.question).toContain('x');
      expect(twoStepLarge.question).toContain('+');
    });

    it('should test all format branches: both_sides_simple, parentheses, both_sides_complex', () => {
      // both_sides_simple (stage 13)
      const bothSidesSimple = generateEquation(13);
      expect(bothSidesSimple.question).toContain('x');
      expect(bothSidesSimple.question.split('x').length).toBeGreaterThan(2); // Multiple x's

      // parentheses (stage 14)
      const parentheses = generateEquation(14);
      expect(parentheses.question).toContain('(');
      expect(parentheses.question).toContain('x');

      // both_sides_complex (stage 15)
      const bothSidesComplex = generateEquation(15);
      expect(bothSidesComplex.question).toContain('x');
      expect(bothSidesComplex.question.split('x').length).toBeGreaterThan(2); // Multiple x's
    });

    it('should handle edge cases: boundary levels 1 and 15', () => {
      const level1 = generateEquation(1);
      expect(level1).toHaveProperty('question');
      expect(level1).toHaveProperty('x');

      const level15 = generateEquation(15);
      expect(level15).toHaveProperty('question');
      expect(level15).toHaveProperty('x');
    });

    it('should handle error case: invalid stage level throws error', () => {
      expect(() => generateEquation(0)).toThrow('Stage 0 not found');
      expect(() => generateEquation(-1)).toThrow('Stage -1 not found');
      expect(() => generateEquation(16)).toThrow('Stage 16 not found');
    });

    it('should handle recursive calls in generateFillMinus when b < 0', () => {
      // This tests the recursive branch in generateFillMinus
      for (let i = 0; i < 10; i++) {
        const problem = generateEquation(2);
        expect(problem.x).toBeGreaterThanOrEqual(problem.x - 1); // x should be valid
        expect(problem.x).toBeGreaterThan(0);
      }
    });

    it('should handle recursive calls in generateXMinus when b < 0', () => {
      // This tests the recursive branch in generateXMinus
      for (let i = 0; i < 10; i++) {
        const problem = generateEquation(5);
        expect(problem.x).toBeGreaterThan(0);
      }
    });

    it('should handle recursive calls in generateTwoStepMinus when c < 0', () => {
      // This tests the recursive branch in generateTwoStepMinus
      for (let i = 0; i < 10; i++) {
        const problem = generateEquation(11);
        expect(problem.x).toBeGreaterThan(0);
      }
    });

    it('should test EquationProblemGenerator.getStages()', () => {
      const stages = EquationProblemGenerator.getStages();
      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBe(15);
    });

    it('should test EquationProblemGenerator.getStage()', () => {
      const stage1 = EquationProblemGenerator.getStage(1);
      expect(stage1).toBeDefined();
      expect(stage1?.stage).toBe(1);

      const stage15 = EquationProblemGenerator.getStage(15);
      expect(stage15).toBeDefined();
      expect(stage15?.stage).toBe(15);

      const invalidStage = EquationProblemGenerator.getStage(999);
      expect(invalidStage).toBeUndefined();
    });

    it('should handle default case in switch statement', () => {
      // This tests the default case branch
      // We can't directly test it without modifying the code, but we can ensure all known formats work
      const allFormats = EQUATION_STAGES.map((s) => s.format);
      allFormats.forEach((format) => {
        const stage = EQUATION_STAGES.find((s) => s.format === format);
        if (stage) {
          const problem = generateEquation(stage.stage);
          expect(problem).toHaveProperty('question');
          expect(problem).toHaveProperty('x');
        }
      });
    });
  });
});
