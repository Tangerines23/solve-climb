export class SeededRandom {
  private seed: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.seed = this.hashCode(seed);
    } else {
      this.seed = seed;
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // Linear Congruential Generator (LCG)
  // Parameters from Numerical Recipes
  public next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return Math.abs(this.seed / 4294967296);
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   */
  public randomInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random element from an array.
   */
  public randomElement<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }
}
