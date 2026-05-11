/**
 * Value Object representing a Quiz Combo.
 * Ensures integrity and encapsulates fever level logic.
 */
export type Result<T> = { success: true; data: T } | { success: false; error: string };

export class Combo {
  // 1. Immutable internal state
  private constructor(public readonly value: number) {}

  // 2. Smart Constructor (ROP Pattern)
  static create(value: number): Result<Combo> {
    if (value < 0) {
      return { success: false, error: '콤보는 0 미만일 수 없습니다.' };
    }
    return { success: true, data: new Combo(value) };
  }

  // 3. Business Rules (Encapsulated)
  get feverLevel(): 0 | 1 | 2 {
    if (this.value >= 20) return 2;
    if (this.value >= 5) return 1;
    return 0;
  }

  get showSpeedLines(): boolean {
    return this.value >= 5;
  }

  // 4. Immutable Business Behaviors
  increment(): Combo {
    // 콤보 증가는 항상 성공하므로 새 인스턴스를 직접 생성
    return new Combo(this.value + 1);
  }

  static reset(): Combo {
    return new Combo(0);
  }
}
