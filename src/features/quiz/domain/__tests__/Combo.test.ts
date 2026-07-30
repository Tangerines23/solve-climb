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

  it('should decay combo correctly', () => {
    const comboRes = Combo.create(10);
    if (comboRes.ok) {
      const decayed = comboRes.value.decay(0.5);
      expect(decayed.value).toBe(5);
    }
  });
});
