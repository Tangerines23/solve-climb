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
    expect(problem.question).toBe('이 도형의 꼭짓점 수 = ?');
    expect((problem as any).hintType).toBe('shape-visualizer');
    expect(problem.answer).toBe(4);
  });

  it('should generate Level 2 Symmetry', () => {
    const rng = mockRng([5]); // n=5 (오각형)
    const problem = generateGeometryProblem(2, 'easy', rng);
    expect(problem.question).toContain('정오각형');
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 3 Triangle Properties', () => {
    const rng = mockRng([0]);
    const problem = generateGeometryProblem(3, 'easy', rng);
    expect(problem.question).toContain('삼각형 내각');
  });

  it('should generate Level 4 Quad Properties', () => {
    const rng = mockRng([0]);
    const problem = generateGeometryProblem(4, 'easy', rng);
    expect(problem.question).toContain('평행사변형');
  });

  it('should generate Level 5 Area Rect', () => {
    const rng = mockRng([4, 6]);
    const problem = generateGeometryProblem(5, 'easy', rng);
    expect(problem.answer).toBe(24);
  });

  it('should generate Level 6 Area Triangle', () => {
    const rng = mockRng([6, 4]);
    const problem = generateGeometryProblem(6, 'easy', rng);
    expect(problem.answer).toBe(24);
  });

  it('should generate Level 7 Area Trapezoid', () => {
    const rng = mockRng([1, 1, 2]);
    const problem = generateGeometryProblem(7, 'easy', rng);
    expect(problem.answer).toBe(4);
  });

  it('should generate Level 8 Circle Basic', () => {
    const rng = mockRng([3]);
    const problem = generateGeometryProblem(8, 'easy', rng);
    expect(problem.answer).toBe(6);
  });

  it('should generate Level 9 Circle Circumference', () => {
    const rng = mockRng([0]);
    const problem = generateGeometryProblem(9, 'easy', rng);
    expect(problem.answer).toBe(12.4);
  });

  it('should generate Level 10 Circle Area', () => {
    const rng = mockRng([0]);
    const problem = generateGeometryProblem(10, 'easy', rng);
    expect(problem.answer).toBe(12.4);
  });

  it('should generate Level 11 Basic Shapes Diagonal', () => {
    const rng = mockRng([1]);
    const problem = generateGeometryProblem(11, 'easy', rng);
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 12 Solid Basic', () => {
    const rngPrism = mockRng([5, 1]);
    const probPrism = generateGeometryProblem(12, 'easy', rngPrism);
    expect(probPrism.question).toContain('5각기둥 모서리');
    expect(probPrism.answer).toBe(15);
  });

  it('should generate Level 13 Solid Volume Rect', () => {
    const rng = mockRng([2, 3, 4]);
    const problem = generateGeometryProblem(13, 'easy', rng);
    expect(problem.answer).toBe(24);
  });

  it('should generate Level 14 Pythagorean Basic', () => {
    const problem = generateGeometryProblem(14, 'easy');
    expect(problem.answer).toBe(5);
  });

  it('should generate Level 15 Trigonometry Basic', () => {
    const rng = mockRng([0]);
    const problem = generateGeometryProblem(15, 'easy', rng);
    expect(problem.question).toContain('tan(45°)');
    expect(problem.answer).toBe(1);
  });

  it('should generate Advanced Line Slope', () => {
    const rng = mockRng([7, 1, 2, 2, 5]);
    const problem = generateGeometryProblem(16, 'hard', rng);
    expect(problem.answer).toBe(2);
  });

  it('should generate Advanced Circle Equation', () => {
    const rng = mockRng([8, 7]);
    const problem = generateGeometryProblem(16, 'hard', rng);
    expect(problem.answer).toBe(49);
  });

  it('should generate Trigonometry problem', () => {
    const rng = mockRng([4, 1]);
    const problem = generateGeometryProblem(16, 'hard', rng);
    expect(problem.answer).toBe('1/2');
  });

  it('should return default shape for unknown level', () => {
    const problem = generateGeometryProblem(999, 'easy');
    expect(problem.question).toBeDefined();
  });
});
