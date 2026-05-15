import { describe, it, expect } from 'vitest';
import { Email } from './Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create anonymous email for null or empty input', () => {
      expect(Email.create(null).isAnonymous).toBe(true);
      expect(Email.create('').isAnonymous).toBe(true);
    });

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
      expect(() => Email.create('test@com')).toThrow('Invalid email format');
    });

    it('should create valid email for correct format', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
      expect(email.isAnonymous).toBe(false);
    });
  });

  describe('UI display', () => {
    it('should mask email correctly', () => {
      expect(Email.create('test@example.com').getMasked()).toBe('te***@example.com');
      expect(Email.create('a@b.com').getMasked()).toBe('a***@b.com');
    });

    it('should return placeholder for anonymous user', () => {
      expect(Email.create(null).getMasked()).toBe('익명 사용자');
    });
  });
});
