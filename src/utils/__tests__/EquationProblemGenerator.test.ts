import { describe, it, expect } from 'vitest';
import { generateEquation, EQUATION_STAGES, EquationProblemGenerator } from '../EquationProblemGenerator';

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
  });
});

