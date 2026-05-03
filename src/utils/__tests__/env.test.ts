import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logEnvInfo, ENV, config } from '../env';
import { logger } from '../logger';

describe('env utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('ENV and config', () => {
    it('should have environment values correctly loaded', () => {
      expect(ENV.VITE_SUPABASE_URL).toBeDefined();
      expect(ENV.VITE_SUPABASE_ANON_KEY).toBeDefined();
      expect(config.SUPABASE_URL).toBe(ENV.VITE_SUPABASE_URL);
    });
  });

  describe('logEnvInfo', () => {
    it('should log environment info if in DEV mode', () => {
      vi.stubEnv('DEV', 'true');
      const groupSpy = vi.spyOn(logger, 'group');

      logEnvInfo();

      expect(groupSpy).toHaveBeenCalledWith('Env', expect.any(String), expect.any(Function));
    });

    it('should not log if not in DEV mode', () => {
      vi.stubEnv('DEV', '');
      const groupSpy = vi.spyOn(logger, 'group');

      logEnvInfo();

      expect(groupSpy).not.toHaveBeenCalled();
    });
  });
});
