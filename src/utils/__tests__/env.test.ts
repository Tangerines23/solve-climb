import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENV, checkEnv, logEnvInfo } from '../env';

describe('env', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ENV', () => {
    it('should have required properties', () => {
      expect(ENV).toHaveProperty('SUPABASE_URL');
      expect(ENV).toHaveProperty('SUPABASE_ANON_KEY');
      expect(ENV).toHaveProperty('IS_DEVELOPMENT');
      expect(ENV).toHaveProperty('IS_PRODUCTION');
      expect(ENV).toHaveProperty('DEBUG_URL');
      expect(ENV).toHaveProperty('IS_VERCEL');
    });

    it('should have boolean IS_DEVELOPMENT', () => {
      expect(typeof ENV.IS_DEVELOPMENT).toBe('boolean');
    });

    it('should have boolean IS_PRODUCTION', () => {
      expect(typeof ENV.IS_PRODUCTION).toBe('boolean');
    });

    it('should have boolean IS_VERCEL', () => {
      expect(typeof ENV.IS_VERCEL).toBe('boolean');
    });

    it('should have string SUPABASE_URL', () => {
      expect(typeof ENV.SUPABASE_URL).toBe('string');
    });

    it('should have string SUPABASE_ANON_KEY', () => {
      expect(typeof ENV.SUPABASE_ANON_KEY).toBe('string');
    });

    it('should have string DEBUG_URL', () => {
      expect(typeof ENV.DEBUG_URL).toBe('string');
    });
  });

  describe('checkEnv', () => {
    it('should return validation result', () => {
      const result = checkEnv();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.missing)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('logEnvInfo', () => {
    it('should not throw error', () => {
      expect(() => {
        logEnvInfo();
      }).not.toThrow();
    });
  });
});

