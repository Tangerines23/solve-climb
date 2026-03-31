import { describe, it, expect } from 'vitest';
import { generateCalculusProblem } from '../CalculusProblemGenerator';

describe('CalculusProblemGenerator', () => {
  const mockRng = (intValues: number[], randomValues: number[] = []) => {
    let intIdx = 0;
    let randIdx = 0;
    return {
      randomInt: (_min: number, _max: number) => {
        const val = intValues[intIdx % intValues.length];
        intIdx++;
        return val;
      },
      random: () => {
        const val = randomValues[randIdx % randomValues.length] ?? 0.5;
        randIdx++;
        return val;
      }
    };
  };

  it('should generate Level 1 Coordinate problem (First Quadrant)', () => {
    const rng = mockRng([2, 3]); // x=2, y=3
    const problem = generateCalculusProblem(1, 'easy', rng);
    expect(problem.inputType).toBe('coordinate');
    expect(problem.answer).toBe('2,3');
    expect(problem.question).toContain('(2, 3)');
  });

  it('should generate Level 2 Coordinate problem (All Quadrants)', () => {
    const rng = mockRng([-4, 5]); // x=-4, y=5
    const problem = generateCalculusProblem(2, 'easy', rng);
    expect(problem.answer).toBe('-4,5');
  });

  it('should generate Level 3-5 Function problem (Type 1: plus)', () => {
    const rng = mockRng([2, 1, 3]); // x=2, type=1(plus), a=3
    const problem = generateCalculusProblem(3, 'easy', rng);
    expect(problem.question).toContain('f(x) = x + 3');
    expect(problem.answer).toBe(5);
    expect(problem.hintType).toBe('function-machine');
    expect(problem.hintData).toEqual({ type: 'plus', value: 3, input: 2 });
  });

  it('should generate Level 3-5 Function problem (Type 2: square)', () => {
    const rng = mockRng([3, 2]); // x=3, type=2(square)
    const problem = generateCalculusProblem(5, 'easy', rng);
    expect(problem.question).toContain('f(x) = x²');
    expect(problem.answer).toBe(9);
    expect(problem.hintData).toEqual({ type: 'square', value: 2, input: 3 });
  });

  it('should return static Limit problems for Level 6-8', () => {
    expect(generateCalculusProblem(6, 'easy').answer).toBe('∞');
    expect(generateCalculusProblem(7, 'easy').answer).toBe(0);
    expect(generateCalculusProblem(8, 'easy').answer).toBe(2);
  });

  it('should generate Level 9-12 Derivative problems (All Types)', () => {
    // Level 9: basic (d/dx x^n)
    const rng9 = mockRng([2, 3]); // x=2, n=3
    expect(generateCalculusProblem(9, 'easy', rng9).answer).toBe(12); // 3 * 2^2

    // Level 10: coefficient (d/dx ax^n)
    const rng10 = mockRng([1, 2, 5]); // x=1, n=2, a=5
    expect(generateCalculusProblem(10, 'easy', rng10).answer).toBe(10); // 5 * 2 * 1

    // Level 11: linear (d/dx ax)
    const rng11 = mockRng([2, 3, 4]); // x=2, n=3, a=4
    expect(generateCalculusProblem(11, 'easy', rng11).answer).toBe(4);

    // Level 12: const (d/dx c)
    const rng12 = mockRng([1, 2, 3, 99]); // x, n, a (ignored), c=99
    expect(generateCalculusProblem(12, 'easy', rng12).answer).toBe(0);
  });

  it('should generate Level 13-14 Integral problems', () => {
    // Level 13: power
    const rng13 = mockRng([2, 3]); // n=2 (coeff=3, power=2), x=3
    expect(generateCalculusProblem(13, 'easy', rng13).answer).toBe(27); // 3^3

    // Level 14: simple
    const rng14 = mockRng([1, 7]); // n=ignored, a=7
    expect(generateCalculusProblem(14, 'easy', rng14).answer).toBe(7); // ∫ 7 dx at x=1
  });

  it('should handle Level 15 Randomization properly', () => {
    const rngDeriv = mockRng([2, 3, 4], [0.6]); // random > 0.5 -> derivative
    const p1 = generateCalculusProblem(15, 'easy', rngDeriv);
    expect(p1.question).toContain('d/dx');

    const rngInteg = mockRng([1, 5], [0.4]); // random <= 0.5 -> integral
    const p2 = generateCalculusProblem(15, 'easy', rngInteg);
    expect(p2.question).toContain('∫');
  });

  it('should generate Advanced problems for Level > 15', () => {
    // case 1: Definite Integral
    const rngInt = mockRng([1, 2, 3]); // randomVal=1, a=2, b=3
    const probInt = generateCalculusProblem(20, 'hard', rngInt);
    expect(probInt.question).toContain('∫(0부터 3까지) 4x dx');
    expect(probInt.answer).toBe(18); // 2 * 3 * 3

    // case 2: Advanced Derivative (Product Rule)
    const rngProd = mockRng([2, 3], []); // randomVal=2, a=3
    const probProd = generateCalculusProblem(20, 'hard', { ...rngProd, random: () => 0.6 });
    expect(probProd.question).toContain('x(x + 3)');
    expect(probProd.answer).toBe(5); // 2 + 3

    // case 2: Advanced Derivative (Chain Rule)
    const probChain = generateCalculusProblem(20, 'hard', { ...rngProd, random: () => 0.4 });
    expect(probChain.question).toContain('(x + 3)²');
    expect(probChain.answer).toBe(8); // 2 * (1 + 3)

    // case 3: Factorization Limit
    const rngLimit = mockRng([3, 5]); // randomVal=3, a=5
    const probLimit = generateCalculusProblem(20, 'hard', rngLimit);
    expect(probLimit.question).toContain('x → 5');
    expect(probLimit.answer).toBe(10); // 2 * 5
  });

  it('should use default generator for unknown levels', () => {
    const problem = generateCalculusProblem(999, 'easy');
    expect(problem.question).toBeDefined();
  });
});
