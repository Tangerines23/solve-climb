import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateQuestion,
  generateWorld1Question,
  generateWorld2Question,
  generateWorld3Question,
  generateWorld4Question,
  generateMathQuestion
} from '../quizGenerator';
import * as MathProblemGenerator from '../MathProblemGenerator';
import * as EquationProblemGenerator from '../EquationProblemGenerator';
import * as LogicProblemGenerator from '../LogicProblemGenerator';
import * as GeometryProblemGenerator from '../GeometryProblemGenerator';
import * as StatsProblemGenerator from '../StatsProblemGenerator';
import * as CSProblemGenerator from '../CSProblemGenerator';
import * as CalculusProblemGenerator from '../CalculusProblemGenerator';
import type { Category, Difficulty, World } from '../../types/quiz';

// Mock math utilities
vi.mock('../math', () => ({
  generateRandomNumber: vi.fn((_difficulty: string) => 10),
}));

describe('quizGenerator Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  describe('generateQuestion (Main Entry)', () => {
    it('should route to correct worlds', () => {
      expect(generateQuestion('World1', '기초', 1, 'easy').question).toBeDefined();
      expect(generateQuestion('World2', '기초', 1, 'easy').question).toBeDefined();
      expect(generateQuestion('World3', '기초', 1, 'easy').question).toBeDefined();
      expect(generateQuestion('World4', '기초', 1, 'easy').question).toBeDefined();
      expect(generateQuestion('UnknownWorld' as any, '기초', 1, 'easy').question).toBeDefined();
    });
  });

  describe('generateWorld1Question (Arithmetic & Algebra)', () => {
    it('should handle all categories', () => {
      expect(generateWorld1Question('기초', 1, 'easy').question).toBeDefined();
      expect(generateWorld1Question('대수', 1, 'easy').question).toMatch(/□|x/);
      expect(generateWorld1Question('논리', 1, 'easy').question).toBeDefined();
      expect(generateWorld1Question('심화', 1, 'easy').question).toBeDefined();
      expect(generateWorld1Question('Unknown' as any, 1, 'easy').question).toContain('+');
    });

    it('should catch errors and fallback', () => {
      vi.spyOn(MathProblemGenerator, 'generateProblem').mockImplementationOnce(() => { throw new Error('fail'); });
      vi.spyOn(EquationProblemGenerator, 'generateEquation').mockImplementationOnce(() => { throw new Error('fail'); });
      vi.spyOn(LogicProblemGenerator, 'generateLogicProblem').mockImplementationOnce(() => { throw new Error('fail'); });
      vi.spyOn(CalculusProblemGenerator, 'generateCalculusProblem').mockImplementationOnce(() => { throw new Error('fail'); });

      expect(generateWorld1Question('기초', 1, 'easy').question).toBeDefined();
      expect(generateWorld1Question('대수', 1, 'easy').question).toBeDefined();
      expect(generateWorld1Question('논리', 1, 'easy').question).toBeDefined();
      expect(generateWorld1Question('심화', 1, 'easy').question).toBeDefined();
    });
  });

  describe('generateWorld2Question (Geometry)', () => {
    it('should handle categories and symmetry levels', () => {
      expect(generateWorld2Question('기초', 1, 'easy').question).toBeDefined();
      expect(generateWorld2Question('논리', 9, 'easy').question).toContain('정사각형');
      expect(generateWorld2Question('논리', 10, 'easy').question).toContain('정삼각형');
      expect(generateWorld2Question('논리', 1, 'easy').question).toBeTruthy();
      expect(generateWorld2Question('Unknown' as any, 1, 'easy').question).toContain('준비 중');
    });

    it('should handle fallback in World 2 기초', () => {
      vi.spyOn(GeometryProblemGenerator, 'generateGeometryProblem').mockImplementationOnce(() => { throw new Error('fail'); });
      expect(generateWorld2Question('기초', 1, 'easy').question).toBeTruthy();
    });
  });

  describe('generateWorld3Question (Stats)', () => {
    it('should handle categories', () => {
      expect(generateWorld3Question('기초', 1, 'easy').question).toBeDefined();
      expect(generateWorld3Question('Unknown' as any, 1, 'easy').question).toContain('준비 중');
    });

    it('should handle fallback in World 3 기초', () => {
      vi.spyOn(StatsProblemGenerator, 'generateStatsProblem').mockImplementationOnce(() => { throw new Error('fail'); });
      expect(generateWorld3Question('기초', 1, 'easy').question).toBeTruthy();
    });
  });

  describe('generateWorld4Question (Engineering)', () => {
    it('should handle categories', () => {
      expect(generateWorld4Question('기초', 1, 'easy').question).toBeDefined();
      expect(generateWorld4Question('논리', 1, 'easy').question).toMatch(/AND|OR|NOT/);
      expect(generateWorld4Question('Unknown' as any, 1, 'easy').question).toContain('준비 중');
    });

    it('should handle fallback in World 4 기초', () => {
      vi.spyOn(CSProblemGenerator, 'generateCSProblem').mockImplementationOnce(() => { throw new Error('fail'); });
      expect(generateWorld4Question('기초', 1, 'easy').question).toBeTruthy();
    });
  });

  describe('generateMathQuestion (The Math Core)', () => {
    it('should cover addition', () => {
      const q = generateMathQuestion('덧셈', 'easy');
      expect(q.question).toContain('+');
    });

    it('should cover subtraction and ensure no zero/negative', () => {
      const randomSpy = vi.spyOn(Math, 'random');

      // Case 1: x > y
      randomSpy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.2).mockReturnValue(0.5);
      const q1 = generateMathQuestion('뺄셈', 'easy');
      expect(q1.question).toContain('-');
      expect(q1.answer as number).toBeGreaterThan(0);

      // Case 2: x === y (triggers retry logic)
      randomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5) // initially same
        .mockReturnValueOnce(0.7).mockReturnValueOnce(0.3); // retry different
      const q2 = generateMathQuestion('뺄셈', 'easy');
      expect(q2.answer as number).toBeGreaterThan(0);

      // Case 3: x === y retry logic with same randoms again (hits the final fallback)
      randomSpy.mockReturnValue(0.5);
      const q3 = generateMathQuestion('뺄셈', 'easy');
      expect(q3.answer as number).toBe(1);
    });

    it('should cover multiplication', () => {
      const q = generateMathQuestion('곱셈', 'easy');
      expect(q.question).toContain('×');
    });

    it('should cover division', () => {
      const q = generateMathQuestion('나눗셈', 'easy');
      expect(q.question).toContain('÷');
      expect(Number.isInteger(q.answer)).toBe(true);
    });

    it('should cover equations and calculus via redirect', () => {
      expect(generateMathQuestion('equations', 'easy').question).toMatch(/□|x/);
      expect(generateMathQuestion('calculus', 'easy').question).toBeDefined();
    });

    it('should use default for unknown topics', () => {
      expect(generateMathQuestion('Unknown' as any, 'easy').question).toContain('+');
    });
  });
});
