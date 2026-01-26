import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENV, config, logEnvInfo } from '../env';

describe('env', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ENV (t3-env)', () => {
    it('should have client properties with VITE_ prefix', () => {
      expect(ENV).toHaveProperty('VITE_SUPABASE_URL');
      expect(ENV).toHaveProperty('VITE_SUPABASE_ANON_KEY');
      expect(ENV).toHaveProperty('VITE_ADMOB_APP_ID');
      expect(ENV).toHaveProperty('VITE_ADMOB_REWARDED_ID');
      // optional properties might be undefined but keys exist in validated object if t3-env handles them
    });

    it('should have correct types for VITE_ variables', () => {
      expect(typeof ENV.VITE_SUPABASE_URL).toBe('string');
      expect(typeof ENV.VITE_SUPABASE_ANON_KEY).toBe('string');
      // VITE_IS_VERCEL is transformed to boolean
      if (ENV.VITE_IS_VERCEL !== undefined) {
        expect(typeof ENV.VITE_IS_VERCEL).toBe('boolean');
      }
    });
  });

  describe('config (legacy compatibility)', () => {
    it('should have required legacy properties mapped from ENV', () => {
      expect(config).toHaveProperty('SUPABASE_URL');
      expect(config).toHaveProperty('SUPABASE_ANON_KEY');
      expect(config).toHaveProperty('IS_DEVELOPMENT');
      expect(config).toHaveProperty('IS_PRODUCTION');
      expect(config).toHaveProperty('DEBUG_URL');
      expect(config).toHaveProperty('IS_VERCEL');
    });

    it('should have boolean IS_DEVELOPMENT', () => {
      expect(typeof config.IS_DEVELOPMENT).toBe('boolean');
    });

    it('should have boolean IS_PRODUCTION', () => {
      expect(typeof config.IS_PRODUCTION).toBe('boolean');
    });

    it('should have boolean IS_VERCEL', () => {
      expect(typeof config.IS_VERCEL).toBe('boolean');
    });

    it('should have string SUPABASE_URL', () => {
      expect(typeof config.SUPABASE_URL).toBe('string');
    });

    it('should have string SUPABASE_ANON_KEY', () => {
      expect(typeof config.SUPABASE_ANON_KEY).toBe('string');
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
