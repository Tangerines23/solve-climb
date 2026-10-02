import { describe, it, expect } from 'vitest';
import { Combo } from '../Combo';

describe('Combo Value Object', () => {
  it('should create valid Combo instance via smart constructor (ROP)', () => {
    const res = Combo.create(10);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.value).toBe(10);
      expect(res.value.feverLevel).toBe(2); // 10 / 5 = 2
    }
  });

  it('should return error Result when value is negative', () => {
    const res = Combo.create(-5);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe('콤보는 0 미만이 될 수 없습니다.');
    }
  });

  it('should correctly increment combo and return new immutable Combo', () => {
    const initialRes = Combo.create(4);
    expect(initialRes.ok).toBe(true);
    if (initialRes.ok) {
      const nextCombo = initialRes.value.increment();
      expect(nextCombo.value).toBe(5);
      expect(nextCombo.feverLevel).toBe(1);
      expect(initialRes.value.value).toBe(4); // Immutability verified
    }
  });

  it('should reset combo to 0', () => {
    const comboRes = Combo.create(15);
    if (comboRes.ok) {
      const resetCombo = comboRes.value.reset();
      expect(resetCombo.value).toBe(0);
      expect(resetCombo.feverLevel).toBe(0);
    }
  });

  it('should floor floating-point combo values', () => {
    const res = Combo.create(7.8);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.value).toBe(7);
      expect(res.value.feverLevel).toBe(1);
    }
  });

  it('should return error Result when value is NaN or not a number', () => {
    const resNaN = Combo.create(NaN);
    expect(resNaN.ok).toBe(false);
    if (!resNaN.ok) {
      expect(resNaN.error).toBe('콤보는 숫자 값이어야 합니다.');
    }

    const resType = Combo.create('10' as unknown as number);
    expect(resType.ok).toBe(false);
  });

  it('should accept custom feverLevel when provided', () => {
    const res = Combo.create(3, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.value).toBe(3);
      expect(res.value.feverLevel).toBe(2);
    }
  });

  it('should clamp auto-calculated feverLevel to a maximum of 3', () => {
    const resHigh = Combo.create(50);
    expect(resHigh.ok).toBe(true);
    if (resHigh.ok) {
      expect(resHigh.value.feverLevel).toBe(3);
    }
  });

  it('should correctly increment combo and return new immutable Combo', () => {
    const initialRes = Combo.create(4);
    expect(initialRes.ok).toBe(true);
    if (initialRes.ok) {
      const nextCombo = initialRes.value.increment();
      expect(nextCombo.value).toBe(5);
      expect(nextCombo.feverLevel).toBe(1);
      expect(initialRes.value.value).toBe(4); // Immutability verified
    }
  });

  it('should reset combo to 0 and preserve immutability', () => {
    const comboRes = Combo.create(15);
    if (comboRes.ok) {
      const resetCombo = comboRes.value.reset();
      expect(resetCombo.value).toBe(0);
      expect(resetCombo.feverLevel).toBe(0);
      expect(comboRes.value.value).toBe(15); // Original preserved
    }
  });

  it('should decay combo correctly with custom decayFactor and floor to 0', () => {
    const comboRes = Combo.create(10);
    if (comboRes.ok) {
      const decayed = comboRes.value.decay(0.5);
      expect(decayed.value).toBe(5);
      expect(decayed.feverLevel).toBe(1);

      const customDecay = comboRes.value.decay(0.2);
      expect(customDecay.value).toBe(2);

      const smallCombo = Combo.create(1);
      if (smallCombo.ok) {
        const floorZero = smallCombo.value.decay(0.5);
        expect(floorZero.value).toBe(0);
        expect(floorZero.feverLevel).toBe(0);
      }
    }
  });

  it('should correctly evaluate equals() for identical and different Combos', () => {
    const c1 = Combo.create(10);
    const c2 = Combo.create(10);
    const c3 = Combo.create(11);
    const cCustom = Combo.create(10, 1);

    if (c1.ok && c2.ok && c3.ok && cCustom.ok) {
      expect(c1.value.equals(c2.value)).toBe(true);
      expect(c1.value.equals(c3.value)).toBe(false);
      expect(c1.value.equals(cCustom.value)).toBe(false);
    }
  });

  it('should format toString() correctly', () => {
    const res = Combo.create(12);
    if (res.ok) {
      expect(res.value.toString()).toBe('12 Combo (Fever Lvl 2)');
    }
  });
});
