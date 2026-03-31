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
      }
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
        random: () => { toggle = 1 - toggle; return toggle > 0.5 ? 0.6 : 0.4; } 
    };
    const pXor = generateCSProblem(7, 'easy', rngXorFixed);
    expect(pXor.question).toContain('XOR');
  });

  it('should generate Level 8-9 Advanced Bitwise and Algorithm variety', () => {
    // Level 8: Bitwise AND
    const rngBitwise = mockRng([5, 3, 0]); // 5 & 3 = 1
    const pBit = generateCSProblem(8, 'easy', rngBitwise);
    expect(pBit.answer).toBe(1);

    // Level 9: Algorithm Variety (LIFO/FIFO)
    const rngAlgo = mockRng([1]); // Stack (LIFO)
    const pAlgo = generateCSProblem(9, 'easy', rngAlgo);
    expect(pAlgo.answer).toBe(1);
    expect(pAlgo.question).toContain('LIFO');
  });

  it('should generate Level 10 Memory Unit Master', () => {
    // Type 1: Byte to KB, kb value 2^3=8
    const rngMem = mockRng([1, 3]); 
    const prob = generateCSProblem(10, 'easy', rngMem);
    expect(prob.answer).toBe(8);
    expect(prob.question).toContain('8192 바이트');
  });

  it('should generate level > 10 advanced problems', () => {
    // Case 4: Memory unit MB to KB
    const rngMem = mockRng([4, 2, 2]); // val=4, type=2, mb=2^2=4
    const prob = generateCSProblem(15, 'hard', rngMem);
    expect(prob.answer).toBe(4);
    expect(prob.question).toContain('4096 KB는 몇 MB');
  });
});
