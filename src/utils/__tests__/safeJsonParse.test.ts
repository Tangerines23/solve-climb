import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeJsonParse, parseLocalSession } from '../safeJsonParse';

describe('safeJsonParse', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should parse valid JSON', () => {
    const result = safeJsonParse('{"key":"value"}', null);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return default value for invalid JSON', () => {
    const result = safeJsonParse('invalid json', null);
    expect(result).toBeNull();
  });

  it('should return default value for empty string', () => {
    const result = safeJsonParse('', null);
    expect(result).toBeNull();
  });

  it('should parse arrays', () => {
    const result = safeJsonParse('[1,2,3]', null);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse numbers', () => {
    const result = safeJsonParse('123', null);
    expect(result).toBe(123);
  });

  it('should parse strings', () => {
    const result = safeJsonParse('"test"', null);
    expect(result).toBe('test');
  });

  it('should validate with validator function', () => {
    const validator = (data: unknown): data is { key: string } =>
      typeof data === 'object' && data !== null && 'key' in data;
    const result = safeJsonParse('{"key":"value"}', null, validator);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return default value when validator fails', () => {
    const validator = (data: unknown): data is { key: string } =>
      typeof data === 'object' && data !== null && 'key' in data;
    const result = safeJsonParse('{"invalid":"value"}', null, validator);
    expect(result).toBeNull();
  });
});

describe('parseLocalSession', () => {
  it('should parse valid local session', () => {
    const session = { userId: 'test', isAdmin: false };
    const result = parseLocalSession(JSON.stringify(session));
    expect(result).toEqual(session);
  });

  it('should return null for invalid session', () => {
    const result = parseLocalSession('invalid');
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = parseLocalSession(null);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = parseLocalSession('');
    expect(result).toBeNull();
  });

  it('should return null when session missing userId', () => {
    const invalidSession = { isAdmin: false };
    const result = parseLocalSession(JSON.stringify(invalidSession));
    expect(result).toBeNull();
  });

  it('should return null when session missing isAdmin', () => {
    const invalidSession = { userId: 'test' };
    const result = parseLocalSession(JSON.stringify(invalidSession));
    expect(result).toBeNull();
  });

  it('should return null when session has wrong type for userId', () => {
    const invalidSession = { userId: 123, isAdmin: false };
    const result = parseLocalSession(JSON.stringify(invalidSession));
    expect(result).toBeNull();
  });

  it('should return null when session has wrong type for isAdmin', () => {
    const invalidSession = { userId: 'test', isAdmin: 'true' };
    const result = parseLocalSession(JSON.stringify(invalidSession));
    expect(result).toBeNull();
  });

  it('should handle validator returning false', () => {
    const validator = vi.fn(() => false);
    const result = safeJsonParse('{"key":"value"}', null, validator);
    expect(result).toBeNull();
    expect(validator).toHaveBeenCalled();
  });

  it('should handle validator returning true', () => {
    const validator = vi.fn(() => true);
    const result = safeJsonParse('{"key":"value"}', null, validator);
    expect(result).toEqual({ key: 'value' });
    expect(validator).toHaveBeenCalled();
  });
});
