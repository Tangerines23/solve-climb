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

  it('should generate Level 2 Median Basic', () => {
    // 10, 5, 15 -> sorted 5, 10, 15 -> median 10
    const rng = mockRng([10, 5, 15]);
    const problem = generateStatsProblem(2, 'easy', rng);
    expect(problem.answer).toBe(10);
  });

  it('should generate Level 3 Mode Basic', () => {
    // base=5, randoms 1, 9 -> [5, 5, 1, 9] -> mode 5
    const rng = mockRng([5, 1, 9]);
    const problem = generateStatsProblem(3, 'easy', rng);
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 4 Coin problem', () => {
    const rng = mockRng([3]); // 3 coins -> 2^3 = 8
    const problem = generateStatsProblem(4, 'easy', rng);
    expect(problem.answer).toBe(8);
  });

  it('should generate Level 5 Dice problem (random path sum)', () => {
    const rng = { ...mockRng([]), random: () => 0.6 };
    const problem = generateStatsProblem(5, 'easy', rng);
    expect(problem.question).toContain('합이 7');
    expect(problem.answer).toBe(6);
  });

  it('should generate Level 5 Dice problem (random path count)', () => {
    const rng = { ...mockRng([]), random: () => 0.4 };
    const problem = generateStatsProblem(5, 'easy', rng);
    expect(problem.question).toContain('3의 배수');
    expect(problem.answer).toBe(2);
  });

  it('should generate Level 6 Marble problem', () => {
    const rng = mockRng([3, 4]); // red=3, blue=4
    const problem = generateStatsProblem(6, 'easy', rng);
    expect(problem.answer).toBe(3);
  });

  it('should generate Level 7 Range problem', () => {
    const rng = mockRng([10, 50, 5, 25]); // max 50, min 5 -> range 45
    const problem = generateStatsProblem(7, 'easy', rng);
    expect(problem.answer).toBe(45);
  });

  it('should generate Level 8 Basic Combination', () => {
    const rng = mockRng([4]); // 4C2 = 4*3/2 = 6
    const problem = generateStatsProblem(8, 'easy', rng);
    expect(problem.answer).toBe(6);
  });

  it('should generate Level 9 Advanced Probability (Type 1)', () => {
    const rng = mockRng([1, 20, 5]); // type=1, total=20, target=5 -> prob not (20-5)/20 = 75%
    const problem = generateStatsProblem(9, 'easy', rng);
    expect(problem.answer).toBe(75);
  });

  it('should generate Level 10 Stats Master', () => {
    const rng = mockRng([10, 2]); // base=10, diff=2 -> avg=10, median=10 -> sum=20
    const problem = generateStatsProblem(10, 'easy', rng);
    expect(problem.answer).toBe(20);
  });

  it('should generate Level > 10 Permutations', () => {
    const rng = mockRng([1, 5]); // randomVal=1, n=5 -> 5P2 = 20
    const problem = generateStatsProblem(15, 'hard', rng);
    expect(problem.question).toContain('5P2');
    expect(problem.answer).toBe(20);
  });

  it('should generate Level > 10 Advanced Combinations', () => {
    const rng = mockRng([4, 6]); // randomVal=4, n=6 -> 6C3 = 20
    const problem = generateStatsProblem(15, 'hard', rng);
    expect(problem.question).toContain('6C3');
    expect(problem.answer).toBe(20);
  });

  it('should generate Level > 10 Conditional Probability', () => {
    const rng = mockRng([2, 4, 3]); // randomVal=2, a=4, b=3 -> 4*3 = 12
    const problem = generateStatsProblem(15, 'hard', rng);
    expect(problem.answer).toBe(12);
  });

  it('should generate Level > 10 Variance', () => {
    const rng = mockRng([3, 2, 11]); // randomVal=3, d=2, m=11 -> variance 2*2^2 = 8
    const problem = generateStatsProblem(15, 'hard', rng);
    expect(problem.answer).toBe(8);
  });

  it('should use default for unknown levels', () => {
    const problem = generateStatsProblem(999, 'easy');
    expect(problem.question).toBeDefined();
  });
});
