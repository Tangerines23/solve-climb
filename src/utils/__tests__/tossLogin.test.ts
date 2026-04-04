import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleTossLogin } from '../tossLogin';

describe('tossLogin utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('handleTossLogin', () => {
    it('should return error if not in Toss app environment', async () => {
      vi.stubGlobal('window', {
        location: { hostname: 'localhost' },
      });

      const result = await handleTossLogin();
      expect(result.success).toBe(false);
      expect(result.error).toContain('토스 앱에서만');
    });

    it('should return error since web-framework is disabled', async () => {
      // Mock Toss app environment
      vi.stubGlobal('window', {
        ReactNativeWebView: {},
        location: { hostname: 'toss.im' },
      });

      const result = await handleTossLogin();
      expect(result.success).toBe(false);
      expect(result.error).toContain('프레임워크가 비활성화');
    });

    it('should return error on SSR (window undefined)', async () => {
      vi.stubGlobal('window', undefined);
      const result = await handleTossLogin();
      expect(result.success).toBe(false);
    });

    it('should catch errors during environment check', async () => {
      vi.stubGlobal('window', {
        get ReactNativeWebView() {
          throw new Error('Test environment error');
        },
      });

      const result = await handleTossLogin();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test environment error');
    });
  });
});
