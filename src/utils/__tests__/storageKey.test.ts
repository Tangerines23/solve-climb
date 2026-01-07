import { describe, it, expect } from 'vitest';
import { createSafeStorageKey } from '../storageKey';

describe('storageKey', () => {
  describe('createSafeStorageKey', () => {
    it('should create key from string parts', () => {
      const key = createSafeStorageKey('prefix', 'suffix');
      expect(key).toBe('prefix_suffix');
    });

    it('should create key from number parts', () => {
      const key = createSafeStorageKey('prefix', 123);
      expect(key).toBe('prefix_123');
    });

    it('should create key from mixed types', () => {
      const key = createSafeStorageKey('category', 'math', 1, 'level');
      expect(key).toBe('category_math_1_level');
    });

    it('should filter out null values', () => {
      const key = createSafeStorageKey('prefix', null, 'suffix');
      expect(key).toBe('prefix_suffix');
    });

    it('should filter out undefined values', () => {
      const key = createSafeStorageKey('prefix', undefined, 'suffix');
      expect(key).toBe('prefix_suffix');
    });

    it('should remove HTML tags', () => {
      const key = createSafeStorageKey('prefix', '<script>alert("xss")</script>test');
      // HTML tags are removed, but special characters in "xss" are also removed
      expect(key).toBe('prefix_alertxsstest');
    });

    it('should remove special characters', () => {
      const key = createSafeStorageKey('prefix', 'test@#$%^&*()');
      expect(key).toBe('prefix_test');
    });

    it('should allow underscore and hyphen', () => {
      const key = createSafeStorageKey('prefix', 'test_123-abc');
      expect(key).toBe('prefix_test_123-abc');
    });

    it('should limit length to 100 characters per part', () => {
      const longString = 'a'.repeat(150);
      const key = createSafeStorageKey('prefix', longString);
      expect(key).toBe(`prefix_${'a'.repeat(100)}`);
    });

    it('should filter out empty parts after sanitization', () => {
      const key = createSafeStorageKey('prefix', '<>', 'suffix');
      expect(key).toBe('prefix_suffix');
    });

    it('should handle empty array', () => {
      const key = createSafeStorageKey();
      expect(key).toBe('');
    });

    it('should handle all null/undefined', () => {
      const key = createSafeStorageKey(null, undefined, null);
      expect(key).toBe('');
    });
  });
});

