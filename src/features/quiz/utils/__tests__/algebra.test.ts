import { describe, it, expect, vi } from 'vitest';
import { parseEquation } from '../algebra';

describe('parseEquation', () => {
  it('should parse a simple equation with spaces', () => {
    const equation = '2x + 5 = 15';
    const result = parseEquation(equation);

    expect(result.left).toHaveLength(2);
    expect(result.right).toHaveLength(1);

    expect(result.left[0]).toMatchObject({
      value: '2x',
      type: 'variable',
      sign: '+',
      side: 'left',
    });
    expect(result.left[1]).toMatchObject({
      value: '5',
      type: 'constant',
      sign: '+',
      side: 'left',
    });
    expect(result.right[0]).toMatchObject({
      value: '15',
      type: 'constant',
      sign: '+',
      side: 'right',
    });
  });

  it('should parse an equation with negative signs', () => {
    const equation = '-3y - 10 = -5';
    const result = parseEquation(equation);

    expect(result.left[0]).toMatchObject({
      value: '3y',
      type: 'variable',
      sign: '-',
      side: 'left',
    });
    expect(result.left[1]).toMatchObject({
      value: '10',
      type: 'constant',
      sign: '-',
      side: 'left',
    });
    expect(result.right[0]).toMatchObject({
      value: '5',
      type: 'constant',
      sign: '-',
      side: 'right',
    });
  });

  it('should handle equations without spaces', () => {
    const equation = 'x+2=y-3';
    const result = parseEquation(equation);

    expect(result.left).toHaveLength(2);
    expect(result.right).toHaveLength(2);
  });

  it('should handle invalid equation format (no equals sign)', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseEquation('2x + 5');

    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle invalid equation format (too many equals signs)', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseEquation('2x = 5 = 10');

    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle sides with no terms', () => {
    const result = parseEquation('=');
    expect(result.left).toEqual([]);
    expect(result.right).toEqual([]);
  });

  it('should generate unique IDs for terms', () => {
    const result = parseEquation('x = x');
    expect(result.left[0].id).toBeDefined();
    expect(result.right[0].id).toBeDefined();
    expect(result.left[0].id).not.toBe(result.right[0].id);
  });
});
