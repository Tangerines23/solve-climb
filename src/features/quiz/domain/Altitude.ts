/**
 * Altitude Value Object
 * Represents the current height/score in the climbing quiz.
 */
export class Altitude {
  private static readonly MIN_VALUE = 0;
  private static readonly MAX_VALUE = 1000000; // 1,000,000m as a practical ceiling

  private constructor(public readonly value: number) {}

  /**
   * Smart Constructor with ROP pattern
   */
  static create(
    value: number
  ): { success: true; data: Altitude } | { success: false; error: string } {
    if (isNaN(value)) {
      return { success: false, error: '고도는 숫자여야 합니다.' };
    }

    if (value < Altitude.MIN_VALUE) {
      return { success: true, data: new Altitude(Altitude.MIN_VALUE) }; // Floor at 0 instead of error
    }

    if (value > Altitude.MAX_VALUE) {
      return { success: false, error: `최대 고도(${Altitude.MAX_VALUE}m)를 초과할 수 없습니다.` };
    }

    return { success: true, data: new Altitude(Math.round(value)) };
  }

  /**
   * Initial altitude (0)
   */
  static reset(): Altitude {
    return new Altitude(0);
  }

  /**
   * Business Logic: Increment altitude
   */
  add(amount: number): Altitude {
    const nextValue = this.value + amount;
    const result = Altitude.create(nextValue);
    return result.success ? result.data : this;
  }

  /**
   * Business Logic: Decrement altitude
   */
  subtract(amount: number): Altitude {
    const nextValue = this.value - amount;
    const result = Altitude.create(nextValue);
    return result.success ? result.data : new Altitude(0);
  }

  /**
   * Comparison helper
   */
  isGreaterThan(other: Altitude | number): boolean {
    const otherValue = typeof other === 'number' ? other : other.value;
    return this.value > otherValue;
  }
}
