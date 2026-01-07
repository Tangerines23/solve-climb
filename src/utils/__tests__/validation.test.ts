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
  });
});
