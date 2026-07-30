import { Result } from './Altitude';

/**
 * Quiz 도메인의 Combo(연속 정답) 상태를 다루는 불변 값 객체 (Value Object)
 */
export class Combo {
  private readonly _value: number;
  private readonly _feverLevel: number;

  private constructor(value: number, feverLevel: number = 0) {
    this._value = value;
    this._feverLevel = feverLevel;
  }

  /**
   * Combo 값 객체를 생성하는 스마트 생성자 (ROP Pattern)
   * @param value 콤보 수
   * @param feverLevel 피버 단계 (기본값: 콤보에 맞춰 자동 계산)
   */
  public static create(value: number, feverLevel?: number): Result<Combo, string> {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { ok: false, error: '콤보는 숫자 값이어야 합니다.' };
    }

    if (value < 0) {
      return { ok: false, error: '콤보는 0 미만이 될 수 없습니다.' };
    }

    const intValue = Math.floor(value);
    const calculatedFever = feverLevel ?? Math.min(3, Math.floor(intValue / 5));

    return { ok: true, value: new Combo(intValue, calculatedFever) };
  }

  /**
   * 콤보 숫자 값
   */
  public get value(): number {
    return this._value;
  }

  /**
   * 피버 단계 (0 ~ 3)
   */
  public get feverLevel(): number {
    return this._feverLevel;
  }

  /**
   * 콤보 1 증가 (불변 객체 반환)
   */
  public increment(): Combo {
    const nextValue = this._value + 1;
    const nextFever = Math.min(3, Math.floor(nextValue / 5));
    return new Combo(nextValue, nextFever);
  }

  /**
   * 콤보 리셋 (0 콤보 불변 객체 반환)
   */
  public reset(): Combo {
    return new Combo(0, 0);
  }

  /**
   * 콤보 감쇠 (실수 시 일정 비율 감소, 불변 객체 반환)
   */
  public decay(decayFactor: number = 0.5): Combo {
    const nextValue = Math.max(0, Math.floor(this._value * decayFactor));
    const nextFever = Math.min(3, Math.floor(nextValue / 5));
    return new Combo(nextValue, nextFever);
  }

  /**
   * 동등성 비교
   */
  public equals(other: Combo): boolean {
    return this._value === other.value && this._feverLevel === other.feverLevel;
  }

  /**
   * 문자열 포맷팅
   */
  public toString(): string {
    return `${this._value} Combo (Fever Lvl ${this._feverLevel})`;
  }
}
