import { describe, it, expect } from 'vitest';
import { generateStatsProblem } from '../StatsProblemGenerator';

describe('StatsProblemGenerator', () => {
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

  it('should generate Level 1 Mean Basic (retry logic handled)', () => {
    // 1, 2, 3 sum to 6, avg 2 (Integer)
    const rng = mockRng([1, 2, 3]);
    const problem = generateStatsProblem(1, 'easy', rng);
    expect(problem.question).toContain('1, 2, 3의 평균은?');
    expect(problem.answer).toBe(2);
  });

  it('should generate Level 2 Mean Extended', () => {
    const rng = mockRng([5, 10, 15, 20]); // sum 50 -> not int, retry -> next 4 numbers [2, 4, 6, 8] sum 20, avg 5
    const rngMock = {
      randomInt: (min: number, max: number) => {
        const vals = [5, 10, 15, 20, 2, 4, 6, 8];
        // simple mock that pops or index
        const idx = (rngMock as any)._idx ?? 0;
        (rngMock as any)._idx = idx + 1;
        return vals[idx % vals.length];
      }
    };
    const problem = generateStatsProblem(2, 'easy', rngMock as any);
    expect(problem.question).toContain('2, 4, 6, 8의 평균은?');
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 3 Median Basic', () => {
    // 10, 5, 15 -> sorted 5, 10, 15 -> median 10
    const rng = mockRng([10, 5, 15]);
    const problem = generateStatsProblem(3, 'easy', rng);
    expect(problem.answer).toBe(10);
  });

  it('should generate Level 4 Mode Basic', () => {
    // base=5, randoms 1, 9 -> [5, 5, 1, 9] -> mode 5
    const rng = mockRng([5, 1, 9]);
    const problem = generateStatsProblem(4, 'easy', rng);
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 5 Range problem', () => {
    const rng = mockRng([10, 50, 5, 25]); // max 50, min 5 -> range 45
    const problem = generateStatsProblem(5, 'easy', rng);
    expect(problem.answer).toBe(45);
  });

  it('should generate Level 6 Coin problem', () => {
    const rng = mockRng([3]); // 3 coins -> 2^3 = 8
    const problem = generateStatsProblem(6, 'easy', rng);
    expect(problem.answer).toBe(8);
  });

  it('should generate Level 7 RPS problem', () => {
    const rng = mockRng([2]); // 2 people -> 3^2 = 9
    const problem = generateStatsProblem(7, 'easy', rng);
    expect(problem.answer).toBe(9);
  });

  it('should generate Level 8 Dice problem (sum of two dice)', () => {
    const rng = mockRng([7]); // s=7 -> ans=6
    const problem = generateStatsProblem(8, 'easy', rng);
    expect(problem.question).toContain('두 눈의 합이 7');
    expect(problem.answer).toBe(6);
  });

  it('should generate Level 9 Basic Combination', () => {
    const rng = mockRng([4]); // 4C2 = 4*3/2 = 6
    const problem = generateStatsProblem(9, 'easy', rng);
    expect(problem.answer).toBe(6);
  });

  it('should generate Level 10 Permutations Basic', () => {
    // Factorial case: isFactorial=1, n=3 -> 6
    const rngFact = mockRng([1, 3]);
    const probFact = generateStatsProblem(10, 'easy', rngFact);
    expect(probFact.answer).toBe(6);

    // Permutation case: isFactorial=0, n=5 -> 20
    const rngPerm = mockRng([0, 5]);
    const probPerm = generateStatsProblem(10, 'easy', rngPerm);
    expect(probPerm.answer).toBe(20);
  });

  it('should generate Level 11 Probability Basic', () => {
    const rng = mockRng([2, 1]); // total=5, target=1 -> 20%
    const problem = generateStatsProblem(11, 'easy', rng);
    expect(problem.answer).toBe(20);
  });

  it('should generate Level 12 Probability Advanced', () => {
    const rng = mockRng([3, 2]); // total=10, target=2 -> 80%
    const problem = generateStatsProblem(12, 'easy', rng);
    expect(problem.answer).toBe(80);
  });

  it('should generate Level 13 Probability Union/Intersection', () => {
    const rngAnd = mockRng([1, 1]); // isAnd=1, select=1 -> 25%
    const probAnd = generateStatsProblem(13, 'easy', rngAnd);
    expect(probAnd.answer).toBe(25);

    const rngOr = mockRng([0, 1]); // isAnd=0, select=1 -> 60%
    const probOr = generateStatsProblem(13, 'easy', rngOr);
    expect(probOr.answer).toBe(60);
  });

  it('should generate Level 14 No Replace Count', () => {
    const rng = mockRng([4]); // n=4 -> 12
    const problem = generateStatsProblem(14, 'easy', rng);
    expect(problem.answer).toBe(12);
  });

  it('should generate Level 15 No Replace Prob', () => {
    const rng = mockRng([1]); // select=1 -> 30%
    const problem = generateStatsProblem(15, 'easy', rng);
    expect(problem.answer).toBe(30);
  });

  it('should generate Level > 10 Permutations', () => {
    const rng = mockRng([1, 5]); // randomVal=1, n=5 -> 5P2 = 20
    const problem = generateStatsProblem(16, 'hard', rng);
    expect(problem.question).toContain('5P2');
    expect(problem.answer).toBe(20);
  });

  it('should generate Level > 10 Advanced Combinations', () => {
    const rng = mockRng([4, 6]); // randomVal=4, n=6 -> 6C3 = 20
    const problem = generateStatsProblem(16, 'hard', rng);
    expect(problem.question).toContain('6C3');
    expect(problem.answer).toBe(20);
  });

  it('should generate Level > 10 Conditional Probability', () => {
    const rng = mockRng([2, 4, 3]); // randomVal=2, a=4, b=3 -> 4*3 = 12
    const problem = generateStatsProblem(16, 'hard', rng);
    expect(problem.answer).toBe(12);
  });

  it('should generate Level > 10 Variance', () => {
    const rng = mockRng([3, 2, 11]); // randomVal=3, d=2, m=11 -> variance 2*2^2 = 8
    const problem = generateStatsProblem(16, 'hard', rng);
    expect(problem.answer).toBe(8);
  });

  it('should use default for unknown levels', () => {
    const problem = generateStatsProblem(999, 'easy');
    expect(problem.question).toBeDefined();
  });
});
