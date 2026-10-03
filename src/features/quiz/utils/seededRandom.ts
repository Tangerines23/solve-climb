/**
 * Seeded Random Helper (결정론적 난수 생성기)
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = Number.isFinite(seed) ? seed : 12345;
  }

  next(): number {
    if (this.seed > 2147483647) {
      this.seed = 1;
    }
    const x = Math.sin(this.seed++) * 10000;
    const result = x - Math.floor(x);
    return result >= 0 && result < 1 ? result : 0;
  }

  nextInt(min: number, max: number): number {
    const safeMin = Number.isFinite(min) ? Math.floor(min) : 0;
    const safeMax = Number.isFinite(max) ? Math.floor(max) : 0;
    const [lower, upper] = safeMin <= safeMax ? [safeMin, safeMax] : [safeMax, safeMin];
    return Math.floor(this.next() * (upper - lower + 1)) + lower;
  }
}
