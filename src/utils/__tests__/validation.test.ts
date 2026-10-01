import { describe, it, expect } from 'vitest';
import {
  sanitizeNickname,
  validateNickname,
  safeAccess,
  isValidUUID,
  generateUUID,
} from '../validation';

describe('sanitizeNickname', () => {
  it("returns '' for null", () => {
    expect(sanitizeNickname(null)).toBe('');
  });

  it("returns '' for undefined", () => {
    expect(sanitizeNickname(undefined)).toBe('');
  });

  it("returns '' for numbers", () => {
    // @ts-expect-error test invalid type
    expect(sanitizeNickname(123)).toBe('');
  });

  it("returns '' for non-string", () => {
    // @ts-expect-error test invalid type
    expect(sanitizeNickname({})).toBe('');
  });

  it('removes HTML tags', () => {
    expect(sanitizeNickname('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeNickname('<img src="x">')).toBe('');
    expect(sanitizeNickname('<div><span>test</span></div>')).toBe('test');
  });

  it('normalizes consecutive whitespace and trims', () => {
    expect(sanitizeNickname('  hello   world  ')).toBe('hello world');
    expect(sanitizeNickname('\t\nhello world\n\t')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(sanitizeNickname('')).toBe('');
  });

  it('handles strings with only HTML tags', () => {
    expect(sanitizeNickname('<div><span></span></div>')).toBe('');
  });

  it('handles strings with only whitespace', () => {
    expect(sanitizeNickname('   ')).toBe('');
  });
});

describe('validateNickname', () => {
  it('returns { valid: true } for valid Korean, English, numbers, exactly 10 chars', () => {
    expect(validateNickname('가나다라마가나다라마')).toEqual({ valid: true });
    expect(validateNickname('abcdefghij')).toEqual({ valid: true });
    expect(validateNickname('1234567890')).toEqual({ valid: true });
    expect(validateNickname('가나다라마1234')).toEqual({ valid: true });
  });

  it('returns { valid: false, error: "닉네임을 입력해주세요." } for null', () => {
    expect(validateNickname(null)).toEqual({ valid: false, error: '닉네임을 입력해주세요.' });
  });

  it('returns { valid: false, error: "닉네임을 입력해주세요." } for undefined', () => {
    expect(validateNickname(undefined)).toEqual({ valid: false, error: '닉네임을 입력해주세요.' });
  });

  it('returns { valid: false, error: "닉네임을 입력해주세요." } for empty string', () => {
    expect(validateNickname('')).toEqual({ valid: false, error: '닉네임을 입력해주세요.' });
  });

  it('returns { valid: false, error: "닉네임을 입력해주세요." } for only whitespace', () => {
    expect(validateNickname('   ')).toEqual({ valid: false, error: '닉네임을 입력해주세요.' });
  });

  it('returns { valid: false, error: "닉네임은 10자 이하여야 합니다." } for length > 10', () => {
    expect(validateNickname('가나다라마가나다라마가')).toEqual({
      valid: false,
      error: '닉네임은 10자 이하여야 합니다.',
    });
    expect(validateNickname('abcdefghijk')).toEqual({
      valid: false,
      error: '닉네임은 10자 이하여야 합니다.',
    });
  });

  it('returns { valid: false, error: "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다." } for special characters', () => {
    expect(validateNickname('가나다라마!')).toEqual({
      valid: false,
      error: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
    });
    expect(validateNickname('abcdefghi!')).toEqual({
      valid: false,
      error: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
    });
  });
});

describe('safeAccess', () => {
  it('accesses own properties on an object', () => {
    const obj = { name: 'test', age: 30 };
    expect(safeAccess(obj, 'name')).toBe('test');
    expect(safeAccess(obj, 'age')).toBe(30);
  });

  it('returns undefined for non-existent property', () => {
    const obj = { name: 'test' };
    expect(safeAccess(obj, 'age')).toBeUndefined();
  });

  it('returns undefined for prototype properties', () => {
    const obj = {};
    expect(safeAccess(obj, 'toString')).toBeUndefined();
    expect(safeAccess(obj, '__proto__')).toBeUndefined();
    expect(safeAccess(obj, 'constructor')).toBeUndefined();
  });

  it('returns undefined when obj is null', () => {
    expect(safeAccess(null, 'name')).toBeUndefined();
  });

  it('returns undefined when obj is undefined', () => {
    expect(safeAccess(undefined, 'name')).toBeUndefined();
  });

  it('returns undefined when obj is primitive', () => {
    // @ts-expect-error test invalid type
    expect(safeAccess(123, 'toString')).toBeUndefined();
    // @ts-expect-error test invalid type
    expect(safeAccess('test', 'length')).toBeUndefined();
    // @ts-expect-error test invalid type
    expect(safeAccess(true, 'valueOf')).toBeUndefined();
  });
});

describe('isValidUUID', () => {
  it('returns true for standard lowercase UUID', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('returns true for uppercase UUID', () => {
    expect(isValidUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
  });

  it('returns true for trimmed UUID', () => {
    expect(isValidUUID('  123e4567-e89b-12d3-a456-426614174000  ')).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidUUID(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('returns false for non-string', () => {
    // @ts-expect-error test invalid type
    expect(isValidUUID({})).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('returns false for invalid format', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
    expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false);
    expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
  });
});

describe('generateUUID', () => {
  it('returns a valid UUID that passes isValidUUID', () => {
    const uuid = generateUUID();
    expect(isValidUUID(uuid)).toBe(true);
  });

  it('produces distinct values on subsequent calls', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });
});
