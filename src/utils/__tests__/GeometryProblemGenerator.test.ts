import { describe, it, expect } from 'vitest';
import { generateGeometryProblem } from '../GeometryProblemGenerator';

describe('GeometryProblemGenerator', () => {
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

  it('should generate Level 1 Basic Shapes vertices', () => {
    const rng = mockRng([1]); // Index 1: 사각형
    const problem = generateGeometryProblem(1, 'easy', rng);
    expect(problem.question).toContain('사각형');
    expect(problem.answer).toBe(4);
  });

  it('should generate Level 2 Basic Shapes diagonals', () => {
    const rng = mockRng([1]); // Index 1: 오각형
    const problem = generateGeometryProblem(2, 'easy', rng);
    expect(problem.question).toContain('오각형');
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 3 Triangle Properties', () => {
    const rng = mockRng([50, 60]); // a=50, b=60 -> c=70
    const problem = generateGeometryProblem(3, 'easy', rng);
    expect(problem.question).toContain('두 내각이 각각 50도, 60도');
    expect(problem.answer).toBe(70);
  });

  it('should generate Level 4 Quadrilateral Properties', () => {
    // Adjacent case
    const rngAdj = mockRng([1, 120]); // isAdjacent=1, a=120
    const problemAdj = generateGeometryProblem(4, 'easy', rngAdj);
    expect(problemAdj.question).toContain('이웃한 다른 내각');
    expect(problemAdj.answer).toBe(60);

    // Opposite case
    const rngOpp = mockRng([0, 120]); // isAdjacent=0, a=120
    const problemOpp = generateGeometryProblem(4, 'easy', rngOpp);
    expect(problemOpp.question).toContain('마주보는 내각');
    expect(problemOpp.answer).toBe(120);
  });

  it('should generate Level 5 Rectangle Area', () => {
    const rng = mockRng([3, 10]); // w=3, h=10
    const problem = generateGeometryProblem(5, 'easy', rng);
    expect(problem.answer).toBe(30);
  });

  it('should generate Level 6 Triangle Area', () => {
    const rng = mockRng([4, 7]); // b=4*2=8, h=7
    const problem = generateGeometryProblem(6, 'easy', rng);
    expect(problem.answer).toBe(28); // (8*7)/2
  });

  it('should generate Level 7 Circle Diameter', () => {
    const rng = mockRng([5]); // r=5
    const problem = generateGeometryProblem(7, 'easy', rng);
    expect(problem.answer).toBe(10);
  });

  it('should generate Level 8 Circle Advanced (Circumference)', () => {
    const rng = { ...mockRng([0]), random: () => 0.6 }; // index 0: r=5, type=둘레
    const problem = generateGeometryProblem(8, 'easy', rng);
    expect(problem.question).toContain('원의 둘레');
    expect(problem.answer).toBe(31); // 2 * 3.1 * 5
  });

  it('should generate Level 8 Circle Advanced (Area)', () => {
    const rng = { ...mockRng([1]), random: () => 0.4 }; // index 1: r=10, type=넓이
    const problem = generateGeometryProblem(8, 'easy', rng);
    expect(problem.question).toContain('원의 넓이');
    expect(problem.answer).toBe(310); // 3.1 * 10^2
  });

  it('should generate Level 9 Symmetry', () => {
    const rng = mockRng([5]); // n=5 (오각형)
    const problem = generateGeometryProblem(9, 'easy', rng);
    expect(problem.question).toContain('정오각형');
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 10 Pythagorean (Hypotenuse)', () => {
    // Index 0: (3,4,5), random > 0.5 -> find c
    const rng = { ...mockRng([0]), random: () => 0.6 };
    const problem = generateGeometryProblem(10, 'easy', rng);
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 11 Pythagorean Advanced', () => {
    const rng = mockRng([0]); // 7-24-25
    const problem = generateGeometryProblem(11, 'easy', rng);
    expect(problem.answer).toBe(25);
  });

  it('should generate Level 12 Solid properties', () => {
    // Prism case
    const rngPrism = mockRng([5, 1]); // n=5, isPrism=1
    const probPrism = generateGeometryProblem(12, 'easy', rngPrism);
    expect(probPrism.question).toContain('5각기둥의 모서리의 개수');
    expect(probPrism.answer).toBe(15);

    // Pyramid case
    const rngPyramid = mockRng([6, 0]); // n=6, isPrism=0
    const probPyramid = generateGeometryProblem(12, 'easy', rngPyramid);
    expect(probPyramid.question).toContain('6각뿔의 꼭짓점의 개수');
    expect(probPyramid.answer).toBe(7);
  });

  it('should generate Level 13 Solid Volume (Cylinder)', () => {
    const rng = { ...mockRng([0]), random: () => 0.6 }; // cylinderPairs index 0: r=2, h=5
    const problem = generateGeometryProblem(13, 'easy', rng);
    expect(problem.question).toContain('원기둥');
    expect(problem.answer).toBe(62); // 3.1 * 2^2 * 5
  });

  it('should generate Level 14 Solid Surface Area', () => {
    const rng = mockRng([3]); // s=3 -> 6 * 3^2 = 54
    const problem = generateGeometryProblem(14, 'easy', rng);
    expect(problem.answer).toBe(54);
  });

  it('should generate Advanced Solid Volume (Cylinder)', () => {
    // Level > 10, randomVal=1, type=Cylinder, cylinderPairs index 0: r=2, h=5
    const rng = { ...mockRng([1, 0]), random: () => 0.6 };
    const problem = generateGeometryProblem(15, 'hard', rng);
    expect(problem.question).toContain('원기둥');
    expect(problem.answer).toBe(62); // 3.1 * 2^2 * 5
  });

  it('should generate Advanced Midpoint Coordinate', () => {
    // Level > 10, randomVal=6, x1=2, y1=4, x2=6, y2=8
    // Inputs are multiplied by 2 in generator: x1=2*2=4, y1=4*2=8, x2=6*2=12, y2=8*2=16
    // mx = (4+12)/2 = 8, my = (8+16)/2 = 12. Sum = 20
    const rng = mockRng([6, 2, 4, 6, 8]);
    const problem = generateGeometryProblem(15, 'hard', rng);
    expect(problem.answer).toBe(20);
  });

  it('should generate Advanced Line Slope', () => {
    // randomVal=7, x1=1, x2=1+2=3, m=2, y1=5, y2=5+2*(3-1)=9
    const rng = mockRng([7, 1, 2, 2, 5]);
    const problem = generateGeometryProblem(15, 'hard', rng);
    expect(problem.answer).toBe(2);
  });

  it('should generate Advanced Circle Equation', () => {
    // randomVal=8, r=7 -> k=49
    const rng = mockRng([8, 7]);
    const problem = generateGeometryProblem(15, 'hard', rng);
    expect(problem.answer).toBe(49);
  });

  it('should generate Trigonometry problem', () => {
    const rng = mockRng([4, 1]); // randomVal=4, index 1: cos(60)
    const problem = generateGeometryProblem(15, 'hard', rng);
    expect(problem.answer).toBe('1/2');
  });

  it('should return default shape for unknown level', () => {
    const problem = generateGeometryProblem(999, 'easy');
    expect(problem.question).toBeDefined();
  });
});
