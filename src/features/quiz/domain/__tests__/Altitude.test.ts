import { describe, it, expect } from 'vitest';
import { Altitude } from '../Altitude';

describe('Altitude Value Object', () => {
  describe('create()', () => {
    it('should create an Altitude with a valid integer number', () => {
      const result = Altitude.create(100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.meters).toBe(100);
      }
    });

    it('should create an Altitude with a valid float number rounding to 2 decimals', () => {
      const result = Altitude.create(100.123);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.meters).toBe(100.12);
      }
    });

    it('should return an error Result with negative numbers', () => {
      const result = Altitude.create(-10);
      expect(result).toEqual({ ok: false, error: '고도는 0m 미만이 될 수 없습니다.' });
    });

    it('should return an error Result with NaN', () => {
      const result = Altitude.create(NaN);
      expect(result).toEqual({ ok: false, error: '고도는 숫자 값이어야 합니다.' });
    });

    it('should return an error Result with non-numbers', () => {
      // @ts-expect-error testing invalid type runtime check
      const result = Altitude.create('not a number');
      expect(result).toEqual({ ok: false, error: '고도는 숫자 값이어야 합니다.' });
    });
  });

  describe('isZero', () => {
    it('should return true if the altitude is 0', () => {
      const result = Altitude.create(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isZero).toBe(true);
      }
    });

    it('should return false if the altitude is not 0', () => {
      const result = Altitude.create(100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isZero).toBe(false);
      }
    });
  });

  const unwrap = (res: { ok: true; value: Altitude } | { ok: false; error: string }): Altitude => {
    if (!res.ok) throw new Error(res.error);
    return res.value;
  };

  describe('equals()', () => {
    it('should return true if two Altitudes have the same value', () => {
      const altitude1 = unwrap(Altitude.create(100));
      const altitude2 = unwrap(Altitude.create(100));
      expect(altitude1.equals(altitude2)).toBe(true);
    });

    it('should return false if two Altitudes have different values', () => {
      const altitude1 = unwrap(Altitude.create(100));
      const altitude2 = unwrap(Altitude.create(200));
      expect(altitude1.equals(altitude2)).toBe(false);
    });
  });

  describe('add()', () => {
    it('should return a new Altitude with the rounded sum of two Altitudes', () => {
      const altitude1 = unwrap(Altitude.create(100.123));
      const altitude2 = unwrap(Altitude.create(200.456));
      const result = altitude1.add(altitude2);
      expect(result.meters).toBe(300.58);
    });
  });

  describe('subtract()', () => {
    it('should return a new Altitude with the difference of two Altitudes', () => {
      const altitude1 = unwrap(Altitude.create(200));
      const altitude2 = unwrap(Altitude.create(100));
      const result = altitude1.subtract(altitude2);
      expect(result.meters).toBe(100);
    });

    it('should clamp to 0m when other is greater than current', () => {
      const altitude1 = unwrap(Altitude.create(100));
      const altitude2 = unwrap(Altitude.create(200));
      const result = altitude1.subtract(altitude2);
      expect(result.meters).toBe(0);
    });
  });

  describe('toString()', () => {
    it('should return a formatted string with "m"', () => {
      const altitude = unwrap(Altitude.create(1000));
      expect(altitude.toString()).toBe('1,000m');
    });

    it('should return a formatted string with "m" for float numbers', () => {
      const altitude = unwrap(Altitude.create(1000.123));
      expect(altitude.toString()).toBe('1,000.12m');
    });
  });
});
