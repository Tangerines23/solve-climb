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
});
