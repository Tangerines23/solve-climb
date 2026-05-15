/**
 * Tier Value Object
 * Handles tier rank logic and UI display formatting.
 * Implements Null Object Pattern for anonymous users.
 */
export class Tier {
  private constructor(public readonly value: number | null) {}

  /**
   * Null Object for anonymous or unranked users
   */
  static readonly UNRANKED = new Tier(null);

  /**
   * Smart Constructor
   * @param level Tier level (0-6) or null/undefined for unranked
   */
  static create(level: number | null | undefined): Tier {
    if (level === null || level === undefined) {
      return Tier.UNRANKED;
    }

    // Ensure range 0-6 (0: Basecamp, 6: Legend)
    const normalizedLevel = Math.max(0, Math.min(6, Math.floor(level)));
    return new Tier(normalizedLevel);
  }

  /**
   * UI Display Name
   */
  getDisplayName(): string {
    if (this.value === null) return '등급 없음';

    const names = [
      '베이스캠프', // Level 0
      '등산로', // Level 1
      '중턱', // Level 2
      '고지대', // Level 3
      '봉우리', // Level 4
      '정상', // Level 5
      '전설', // Level 6
    ];

    return names[this.value] || '베이스캠프';
  }

  /**
   * Tier Icon/Emoji
   */
  get icon(): string {
    if (this.value === null) return '⛺';

    const icons = ['⛺', '🥾', '⛰️', '🏔️', '🦅', '🚩', '👑'];
    return icons[this.value] || '⛺';
  }

  /**
   * CSS Color Variable Name
   */
  get colorVar(): string {
    if (this.value === null) return '--color-tier-base';

    const colors = [
      '--color-tier-base',
      '--color-tier-trail',
      '--color-tier-mid',
      '--color-tier-high',
      '--color-tier-peak',
      '--color-tier-summit',
      '--color-tier-legend',
    ];
    return colors[this.value] || '--color-tier-base';
  }

  /**
   * Status check
   */
  get isUnranked(): boolean {
    return this.value === null;
  }

  /**
   * For JSON serialization
   */
  toJSON(): number | null {
    return this.value;
  }
}
