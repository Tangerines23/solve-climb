import { describe, it, expect } from 'vitest';
import { generateCSProblem } from '../CSProblemGenerator';

describe('CSProblemGenerator', () => {
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
      },
    };
  };

  it('should generate Level 1 Binary to Decimal conversion', () => {
    const rng = mockRng([13]); // Binary for 13 is 1101
    const problem = generateCSProblem(1, 'easy', rng);
    expect(problem.question).toContain('2진수 1101');
    expect(problem.answer).toBe(13);
  });

  it('should generate Level 2 Decimal to Binary conversion', () => {
    const rng = mockRng([10]); // Decimal 10
    const problem = generateCSProblem(2, 'easy', rng);
    expect(problem.question).toContain('10진수 10');
    expect(problem.answer).toBe('1010');
  });

  it('should generate Level 3 Hex to Decimal conversion', () => {
    const rng = mockRng([25]); // Hex 19
    const problem = generateCSProblem(3, 'easy', rng);
    expect(problem.question).toContain('16진수 19');
    expect(problem.answer).toBe(25);
  });

  it('should generate Level 4-7 Logic gate problems (AND, OR, NOT, XOR)', () => {
    // Level 4: AND (1 AND 1 = 1)
    const rngAnd = { ...mockRng([]), random: () => 0.6 };
    expect(generateCSProblem(4, 'easy', rngAnd).answer).toBe(1);

    // Level 5: OR (0 OR 0 = 0)
    const rngOr = { ...mockRng([]), random: () => 0.4 };
    expect(generateCSProblem(5, 'easy', rngOr).answer).toBe(0);

    // Level 6: NOT (NOT 1 = 0)
    const rngNot = { ...mockRng([]), random: () => 0.6 };
    expect(generateCSProblem(6, 'easy', rngNot).answer).toBe(0);

    // Level 7: XOR (1 XOR 0 = 1)
    let toggle = 0;
    const rngXorFixed = {
      randomInt: (_m: number, _x: number) => 0,
      random: () => {
        toggle = 1 - toggle;
        return toggle > 0.5 ? 0.6 : 0.4;
      },
    };
    const pXor = generateCSProblem(7, 'easy', rngXorFixed);
    expect(pXor.question).toContain('XOR');
  });

  it('should generate Level 8-14 CS basic curriculum', () => {
    // Level 8: Memory Unit Basic (Byte to KB)
    const rng8 = mockRng([3]); // kb=2^3=8
    const prob8 = generateCSProblem(8, 'easy', rng8);
    expect(prob8.answer).toBe(8);
    expect(prob8.question).toContain('8192 바이트');

    // Level 9: Memory Unit Advanced (KB to MB)
    const rng9 = mockRng([2]); // mb=2^2=4
    const prob9 = generateCSProblem(9, 'easy', rng9);
    expect(prob9.answer).toBe(4);
    expect(prob9.question).toContain('4096 KB는 몇 MB');

    // Level 10: Stack
    const rng10 = mockRng([3, 5, 2]);
    const prob10 = generateCSProblem(10, 'easy', rng10);
    expect(prob10.answer).toBe(5); // 3+2

    // Level 11: Queue
    const rng11 = mockRng([3, 5, 2]);
    const prob11 = generateCSProblem(11, 'easy', rng11);
    expect(prob11.answer).toBe(7); // 5+2

    // Level 12: Ones Complement
    const rng12 = mockRng([1]); // 0101 -> 1010
    const prob12 = generateCSProblem(12, 'easy', rng12);
    expect(prob12.answer).toBe('1010');

    // Level 13: Twos Complement
    const rng13 = mockRng([1]); // 0110 -> 1010
    const prob13 = generateCSProblem(13, 'easy', rng13);
    expect(prob13.answer).toBe('1010');

    // Level 14: Binary Addition
    const rng14 = mockRng([1]); // 011 + 010 -> 101
    const prob14 = generateCSProblem(14, 'easy', rng14);
    expect(prob14.answer).toBe('101');

    // Level 15: Binary Decimals
    const rng15 = mockRng([0]); // Option 0: 0.1 -> 0.5
    const prob15 = generateCSProblem(15, 'easy', rng15);
    expect(prob15.question).toContain('2진수 소수 0.1');
    expect(prob15.answer).toBe(0.5);
  });

  it('should generate level > 15 advanced problems', () => {
    // Case 4: Memory unit MB to KB
    const rngMem = mockRng([4, 2, 2]); // val=4, type=2, mb=2^2=4
    const prob = generateCSProblem(16, 'hard', rngMem);
    expect(prob.answer).toBe(4);
    expect(prob.question).toContain('4096 KB는 몇 MB');
  });
});
