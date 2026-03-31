import { describe, it, expect } from 'vitest';
import { generateHardAlgebraProblem } from '../AlgebraAdvancedGenerator';

describe('AlgebraAdvancedGenerator', () => {
  const mockRng = (values: number[]) => {
    let i = 0;
    return {
      randomInt: (_min: number, _max: number) => values[i++] ?? 0.5
    };
  };

  it('should generate a quadratic problem (Type 1)', () => {
    // problemType = 1, a = 2, b = 3
    const rng = mockRng([1, 2, 3]);
    const problem = generateHardAlgebraProblem(5, 'hard', rng);
    
    expect(problem.expression).toContain('x²');
    expect(problem.expression).toContain('- 5x'); // a+b
    expect(problem.expression).toContain('+ 6'); // a*b
    expect(problem.answer).toBe(3); // larger of 2, 3
  });

  it('should generate an exponential problem (Type 3)', () => {
    // level 5, problemType = 3
    // base index = 0 (base=2), x = 3
    const rng = mockRng([3, 0, 3]);
    const problem = generateHardAlgebraProblem(5, 'hard', rng);
    
    expect(problem.expression).toBe('2ˣ = 8, x = ?');
    expect(problem.answer).toBe(3);
  });

  it('should generate a logarithm problem for higher levels (Level 15, Type 3)', () => {
    // level 15, problemType = 3
    // base index = 1 (base=3), x = 2
    const rng = mockRng([3, 1, 2]);
    const problem = generateHardAlgebraProblem(15, 'hard', rng);
    
    // base 3 -> subMap gives '₃'
    expect(problem.expression).toBe('log₃(9) = ?');
    expect(problem.answer).toBe(2);
  });

  it('should handle level > 20 correctly', () => {
    const rng = mockRng([2, 0, 2]);
    const problem = generateHardAlgebraProblem(25, 'hard', rng);
    expect(problem.expression).toBe('2ˣ = 4, x = ?');
  });

  it('should use default Math.random if rng is not provided', () => {
    const problem = generateHardAlgebraProblem(5, 'hard');
    expect(problem.expression).toBeDefined();
    expect(typeof problem.answer).toBe('number');
  });
});
