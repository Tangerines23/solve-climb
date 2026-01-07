import { describe, it, expect } from 'vitest';
import { sanitizeNickname, validateNickname } from '../validation';

describe('validation', () => {
  describe('sanitizeNickname', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeNickname('<script>alert("xss")</script>test');
      expect(result).not.toContain('<script>');
      expect(result).toContain('test');
    });

    it('should normalize whitespace', () => {
      const result = sanitizeNickname('  test   name  ');
      expect(result).toBe('test name');
    });
  });

  describe('validateNickname', () => {
    it('should return valid for valid nickname', () => {
      const result = validateNickname('user123');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for empty nickname', () => {
      const result = validateNickname('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('닉네임을 입력해주세요.');
    });

    it('should return invalid for nickname longer than 10 characters', () => {
      const result = validateNickname('a'.repeat(11));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('닉네임은 10자 이하여야 합니다.');
    });

    it('should return invalid for nickname with special characters', () => {
      const result = validateNickname('user@name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.');
    });

    it('should return valid for nickname with exactly 10 characters', () => {
      const result = validateNickname('a'.repeat(10));
      expect(result.valid).toBe(true);
    });

    it('should return invalid for nickname with only whitespace', () => {
      const result = validateNickname('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('닉네임을 입력해주세요.');
    });

    it('should return valid for nickname with Korean characters', () => {
      const result = validateNickname('홍길동');
      expect(result.valid).toBe(true);
    });

    it('should return valid for nickname with mixed Korean and English', () => {
      const result = validateNickname('홍길동123');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for nickname with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
      specialChars.forEach((char) => {
        const result = validateNickname(`user${char}name`);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.');
      });
    });
  });

  describe('sanitizeNickname - Edge cases', () => {
    it('should remove various HTML tags', () => {
      const htmlTags = [
        '<script>alert("xss")</script>',
        '<div>content</div>',
        '<span>text</span>',
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(1)">link</a>',
      ];

      htmlTags.forEach((tag) => {
        const result = sanitizeNickname(`${tag}test`);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).toContain('test');
      });
    });

    it('should handle multiple consecutive spaces', () => {
      const result = sanitizeNickname('test    name');
      expect(result).toBe('test name');
    });

    it('should handle tabs and newlines', () => {
      const result = sanitizeNickname('test\t\nname');
      expect(result).toBe('test name');
    });

    it('should handle leading and trailing spaces', () => {
      const result = sanitizeNickname('  test name  ');
      expect(result).toBe('test name');
    });

    it('should handle HTML tags with attributes', () => {
      const result = sanitizeNickname('<div class="test" id="test">content</div>');
      expect(result).toBe('content');
    });

    it('should handle nested HTML tags', () => {
      const result = sanitizeNickname('<div><span>nested</span></div>');
      expect(result).toBe('nested');
    });

    it('should handle empty string', () => {
      const result = sanitizeNickname('');
      expect(result).toBe('');
    });

    it('should handle string with only HTML tags', () => {
      const result = sanitizeNickname('<div></div>');
      expect(result).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = sanitizeNickname('   ');
      expect(result).toBe('');
    });
  });
});
