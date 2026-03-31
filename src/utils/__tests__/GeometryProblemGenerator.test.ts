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
      }
    };
  };

  it('should generate Level 1 Basic Shapes vertices', () => {
    const rng = mockRng([1]); // Index 1: 사각형
    const problem = generateGeometryProblem(1, 'easy', rng);
    expect(problem.question).toContain('사각형');
    expect(problem.answer).toBe(4);
  });

  it('should generate Level 2 Triangle Properties (Equilateral)', () => {
    const rng = mockRng([0]); // Index 0: 정삼각형
    const problem = generateGeometryProblem(2, 'easy', rng);
    expect(problem.question).toContain('정삼각형');
    expect(problem.answer).toBe(60);
  });

  it('should generate Level 2 Triangle Properties (Right Angle)', () => {
    const rng = mockRng([1, 40]); // Index 1: 직각삼각형, a=40
    const problem = generateGeometryProblem(2, 'easy', rng);
    expect(problem.question).toContain('직각삼각형');
    expect(problem.answer).toBe(50); // 90 - 40
  });

  it('should generate Level 3 Quadrilateral Properties', () => {
    const rng = mockRng([0]); // Sum of angles
    const problem = generateGeometryProblem(3, 'easy', rng);
    expect(problem.answer).toBe(360);
  });

  it('should generate Level 4 Rectangle Area', () => {
    const rng = mockRng([3, 10]); // w=3, h=10
    const problem = generateGeometryProblem(4, 'easy', rng);
    expect(problem.answer).toBe(30);
  });

  it('should generate Level 5 Triangle Area', () => {
    const rng = mockRng([4, 7]); // b=4*2=8, h=7
    const problem = generateGeometryProblem(5, 'easy', rng);
    expect(problem.answer).toBe(28); // (8*7)/2
  });

  it('should generate Level 6 Circle Diameter', () => {
    const rng = mockRng([5]); // r=5
    const problem = generateGeometryProblem(6, 'easy', rng);
    expect(problem.answer).toBe(10);
  });

  it('should generate Level 7 Circle Advanced (Circumference)', () => {
    const rng = { ...mockRng([4]), random: () => 0.6 }; // r=4, type=둘레
    const problem = generateGeometryProblem(7, 'easy', rng);
    expect(problem.answer).toBe(24); // 2 * 3 * 4
  });

  it('should generate Level 7 Circle Advanced (Area)', () => {
    const rng = { ...mockRng([4]), random: () => 0.4 }; // r=4, type=넓이
    const problem = generateGeometryProblem(7, 'easy', rng);
    expect(problem.answer).toBe(48); // 3 * 4^2
  });

  it('should generate Level 8 Solid faces', () => {
    const rng = mockRng([0]); // 정육면체
    const problem = generateGeometryProblem(8, 'easy', rng);
    expect(problem.answer).toBe(6);
  });

  it('should generate Level 9 Symmetry', () => {
    const rng = mockRng([1]); // Circle symmetry
    const problem = generateGeometryProblem(9, 'easy', rng);
    expect(problem.answer).toBe(999);
  });

  it('should generate Level 10 Pythagorean (Hypotenuse)', () => {
    // Index 0: (3,4,5), random > 0.5 -> find c
    const rng = { ...mockRng([0]), random: () => 0.6 };
    const problem = generateGeometryProblem(10, 'easy', rng);
    expect(problem.answer).toBe(5);
  });

  it('should generate Advanced Solid Volume (Cylinder)', () => {
    // Level > 10, randomVal=1, type=Cylinder, r=2, h=5
    const rng = { ...mockRng([1, 2, 5]), random: () => 0.6 };
    const problem = generateGeometryProblem(15, 'hard', rng);
    expect(problem.question).toContain('원기둥');
    expect(problem.answer).toBe(60); // 3 * 2^2 * 5
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
