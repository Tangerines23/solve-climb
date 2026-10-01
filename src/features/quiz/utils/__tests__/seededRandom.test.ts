import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../seededRandom';

describe('SeededRandom', () => {
  it('produces deterministic pseudo-random sequences for identical seeds', () => {
    const seed = 12345;
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(67890);

    let allEqual = true;
    for (let i = 0; i < 100; i++) {
      if (rng1.next() !== rng2.next()) {
        allEqual = false;
        break;
      }
    }
    expect(allEqual).toBe(false);
  });

  it('next() outputs numbers strictly in [0, 1)', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('nextInt(min, max) returns integer within [min, max] inclusive', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(1, 10);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it('nextInt handles inverted bounds (min > max) safely without throwing or NaN', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(10, 1);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it('nextInt handles min === max safely', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(5, 5);
      expect(value).toBe(5);
    }
  });

  it('nextInt handles negative ranges like [-10, -1]', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(-10, -1);
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThanOrEqual(-1);
    }
  });

  it('fallback for NaN, null, undefined or non-finite seeds', () => {
    const rng1 = new SeededRandom(NaN);
    // @ts-expect-error test invalid type
    const rng2 = new SeededRandom(null);
    // @ts-expect-error test invalid type
    const rng3 = new SeededRandom(undefined);
    const rng4 = new SeededRandom(Infinity);

    for (let i = 0; i < 100; i++) {
      const v1 = rng1.next();
      const v2 = rng2.next();
      const v3 = rng3.next();
      const v4 = rng4.next();
      expect(v1).toBe(v2);
      expect(v2).toBe(v3);
      expect(v3).toBe(v4);
    }
  });

  it('runs multiple iterations to verify bounds and distribution', () => {
    const rng = new SeededRandom(12345);
    const min = 1;
    const max = 10;
    const counts = Array(max - min + 1).fill(0);

    for (let i = 0; i < 10000; i++) {
      const value = rng.nextInt(min, max);
      counts[value - min]++;
    }

    expect(counts.every((count) => count > 0)).toBe(true);
  });
});
