export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export class Altitude {
  private readonly _meters: number;

  private constructor(meters: number) {
    this._meters = meters;
  }

  /**
   * Altitude 값 객체를 생성하는 스마트 생성자 (ROP)
   * @param meters 고도 값(m)
   */
  public static create(meters: number): Result<Altitude, string> {
    if (typeof meters !== 'number' || Number.isNaN(meters)) {
      return { ok: false, error: '고도는 숫자 값이어야 합니다.' };
    }

    if (meters < 0) {
      return { ok: false, error: '고도는 0m 미만이 될 수 없습니다.' };
    }

    // 소수점 2자리까지만 유효하게 반올림 처리 (부동소수점 방지)
    const roundedMeters = Math.round(meters * 100) / 100;

    return { ok: true, value: new Altitude(roundedMeters) };
  }

  /**
   * 고도 숫자 값 반환
   */
  public get meters(): number {
    return this._meters;
  }

  /**
   * 고도가 0인지 확인
   */
  public get isZero(): boolean {
    return this._meters === 0;
  }

  /**
   * 다른 Altitude 객체와 값이 동등한지 비교
   */
  public equals(other: Altitude): boolean {
    return this._meters === other.meters;
  }

  /**
   * 고도 덧셈
   */
  public add(other: Altitude): Altitude {
    return new Altitude(Math.round((this._meters + other.meters) * 100) / 100);
  }

  /**
   * 고도 뺄셈 (가드 클로즈: 0m 미만 방지)
   */
  public subtract(other: Altitude): Altitude {
    const result = Math.max(0, this._meters - other.meters);
    return new Altitude(Math.round(result * 100) / 100);
  }

  /**
   * 문자열 포맷팅
   */
  public toString(): string {
    return `${this._meters.toLocaleString()}m`;
  }
}
