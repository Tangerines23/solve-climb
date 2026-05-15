import { describe, it, expect } from 'vitest';
import { generateLogicProblem, generateSequenceProblem } from '../LogicProblemGenerator';

describe('LogicProblemGenerator', () => {
  const mockRng = {
    random: () => 0.5,
    randomInt: (min: number, _max: number) => min,
  };

  describe('generateLogicProblem', () => {
    it('should generate Lv 1: Even/Odd problem', () => {
      const problem = generateLogicProblem(1, 'easy', mockRng);
      expect(problem.question).toContain('홀수입니까 짝수입니까');
      expect([1, 2]).toContain(problem.answer);
    });

    it('should generate Lv 2: Pos/Neg problem', () => {
      const problem = generateLogicProblem(2, 'easy', mockRng);
      expect(problem.question).toContain('양수입니까 음수입니까');
      expect([1, 2]).toContain(problem.answer);
    });

    it('should generate Lv 3: Multiple problem', () => {
      const problem = generateLogicProblem(3, 'easy', mockRng);
      expect(problem.question).toContain('배수입니까');
    });

    it('should generate Lv 4: Prime problem', () => {
      const problem = generateLogicProblem(4, 'easy', mockRng);
      expect(problem.question).toContain('소수(Prime Number)입니까');
    });

    it('should generate Lv 5: Comparison Prime problem', () => {
      const problem = generateLogicProblem(5, 'easy', mockRng);
      expect(problem.question).toContain('소수(Prime)인 것은');
    });

    it('should generate Lv 6-10: Sequence problems', () => {
      for (let lv = 6; lv <= 10; lv++) {
        const problem = generateLogicProblem(lv, 'medium', mockRng);
        expect(problem.question).toContain('[ ? ]');
        expect(problem.answer).toBeDefined();
      }
    });

    it('should generate Lv 11: Absolute value problem', () => {
      const problem = generateLogicProblem(11, 'hard', mockRng);
      expect(problem.question).toContain('절댓값');
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    });

    it('should generate Lv 12: Modulo problem', () => {
      const problem = generateLogicProblem(12, 'hard', mockRng);
      expect(problem.question).toContain('나머지는');
    });

    it('should generate Lv 13: Factorial problem', () => {
      const problem = generateLogicProblem(13, 'hard', mockRng);
      expect(problem.question).toContain('팩토리얼');
    });

    it('should generate Lv 14: Custom Operation problem', () => {
      const problem = generateLogicProblem(14, 'hard', mockRng);
      expect(problem.question).toMatch(/[★○]/);
    });

    it('should generate Lv 15: Random Sequence problem', () => {
      const problem = generateLogicProblem(15, 'hard', mockRng);
      expect(problem.question).toContain('[ ? ]');
    });

    it('should handle default case (Level > 15)', () => {
      const problem = generateLogicProblem(99, 'hard', mockRng);
      expect(problem.question).toBeDefined();
    });
  });

  describe('generateSequenceProblem', () => {
    it('should generate arithmetic sequence', () => {
      const problem = generateSequenceProblem('easy', 'arithmetic', mockRng);
      expect(problem.question).toBeDefined();
    });

    it('should generate geometric sequence', () => {
      const problem = generateSequenceProblem('easy', 'geometric', mockRng);
      expect(problem.question).toBeDefined();
    });

    it('should generate fibonacci sequence', () => {
      const problem = generateSequenceProblem('medium', 'fibonacci', mockRng);
      expect(problem.question).toBeDefined();
    });

    it('should generate incrementing_diff sequence', () => {
      const problem = generateSequenceProblem('hard', 'incrementing_diff', mockRng);
      expect(problem.question).toBeDefined();
    });

    it('should generate alternating sequence', () => {
      const problem = generateSequenceProblem('hard', 'alternating', mockRng);
      expect(problem.question).toBeDefined();
    });

    it('should use difficulty types if valid', () => {
      const problem = generateSequenceProblem('easy', undefined, mockRng);
      expect(problem.question).toBeDefined();
    });
  });
});
