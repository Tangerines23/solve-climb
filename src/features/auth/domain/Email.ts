/**
 * Email Value Object
 * Handles email validation and safe data access.
 */
export class Email {
  static readonly ANONYMOUS = new Email(null);

  private constructor(private readonly value: string | null) {}

  /**
   * Smart Constructor
   * @param email Email string or null/undefined
   */
  static create(email: string | null | undefined): Email {
    if (!email) {
      return new Email(null);
    }

    const trimmed = email.trim();
    if (!this.isValid(trimmed)) {
      throw new Error(`Invalid email format: ${trimmed}`);
    }

    return new Email(trimmed);
  }

  /**
   * Regex Validation
   */
  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Raw value access
   */
  toString(): string {
    return this.value || '';
  }

  /**
   * Masked email for UI (e.g., ab***@gmail.com)
   */
  getMasked(): string {
    if (!this.value) return '익명 사용자';

    const [local, domain] = this.value.split('@');
    if (!domain) return this.value;

    const visibleLen = Math.min(2, local.length);
    const maskedLocal = local.substring(0, visibleLen) + '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Status check
   */
  get isAnonymous(): boolean {
    return this.value === null;
  }

  /**
   * For JSON serialization
   */
  toJSON(): string | null {
    return this.value;
  }
}
