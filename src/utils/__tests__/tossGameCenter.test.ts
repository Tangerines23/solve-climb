import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitScoreToLeaderboard, openLeaderboard, getErrorMessage } from '../tossGameCenter';

describe('tossGameCenter', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('import.meta', { env: { DEV: true } });

    // Mock console.warn and console.error
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  vi.mock('../errorHandler', () => ({
    logError: vi.fn(),
    getUserErrorMessage: vi.fn(() => 'Mocked Error Message'),
  }));

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  describe('environment detection', () => {
    it('should identify non-toss environment', async () => {
      vi.stubGlobal('location', { hostname: 'solve-climb.com' });
      delete (global.window as any).ReactNativeWebView;

      const result = await submitScoreToLeaderboard(100);
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('브라우저 환경'));
    });

    it('should identify toss environment', async () => {
      (global.window as any).ReactNativeWebView = {};

      const result = await submitScoreToLeaderboard(100);
      // Since @apps-in-toss/web-framework is commented out in source, it returns false
      expect(result).toBe(false);
    });

    it('should handle local development simulation', async () => {
      // Mock window.location.hostname
      vi.stubGlobal('location', { hostname: 'localhost' });
      delete (global.window as any).ReactNativeWebView;

      const result = await submitScoreToLeaderboard(100);
      expect(result).toBe(true); // isLocalDevelopment && !isTossAppEnvironment returns true
    });
  });

  describe('openLeaderboard', () => {
    it('should return error message in browser environment', async () => {
      vi.stubGlobal('location', { hostname: 'solve-climb.com' });
      delete (global.window as any).ReactNativeWebView;

      const onError = vi.fn();
      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toBe('토스 앱에서만 리더보드를 볼 수 있습니다.');
      expect(onError).toHaveBeenCalledWith(result.message);
    });

    it('should handle errors and return friendly messages', async () => {
      (global.window as any).ReactNativeWebView = {};

      const result = await openLeaderboard();
      expect(result.success).toBe(false);
      expect(result.message).toContain('토스 웹 프레임워크가 비활성화');
    });
  });

  describe('getErrorMessage (unit tests)', () => {
    it('should handle non-Error types', () => {
      // Use toContain to avoid subtle character encoding/spacing issues if any
      expect(getErrorMessage('some string')).toContain('리더보드를 열 수 없습니다');
      expect(getErrorMessage(null)).toContain('리더보드를 열 수 없습니다');
    });

    it('should identify network errors', () => {
      const error = new Error('network failed');
      expect(getErrorMessage(error)).toContain('네트워크');
    });

    it('should identify sandbox environment errors', () => {
      const error = new Error('SANDBOX is not allowed');
      expect(getErrorMessage(error)).toContain('샌드박스');
    });

    it('should identify leaderboard not found errors', () => {
      const error = new Error('leaderboard not found');
      expect(getErrorMessage(error)).toContain('리더보드를 찾을 수 없습니다');
    });

    it('should identify version errors', () => {
      const error = new Error('app version not supported');
      expect(getErrorMessage(error)).toContain('업데이트');
    });

    it('should identify permission errors', () => {
      const error = new Error('unauthorized access');
      expect(getErrorMessage(error)).toContain('권한');
    });

    it('should identify timeout errors', () => {
      const error = new Error('request timeout');
      expect(getErrorMessage(error)).toContain('시간이 초과');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle errors in openLeaderboard and collect debug info', async () => {
      // Force an error inside collectDebugInfo by making something it relies on throw
      // Since it uses isTossAppEnvironment which is safe, let's trigger the catch in openLeaderboard
      (global.window as any).ReactNativeWebView = {};

      // We can't easily force an error in the try block of openLeaderboard because it's mostly synchronous calls
      // but we can mock isTossAppEnvironment to throw if we were using a real mock,
      // here we just use the global window.

      // Let's mock a case where isLocalDevelopment throws
      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, 'hostname', {
        get: () => {
          throw new Error('Location error');
        },
        configurable: true,
      });

      const result = await openLeaderboard();
      expect(result.success).toBe(false);
      expect(console.error).toHaveBeenCalled();

      // Reset hostname
      Object.defineProperty(window.location, 'hostname', {
        value: originalHostname,
        configurable: true,
      });
    });

    it('should handle cases where onError is not provided in catch block', async () => {
      Object.defineProperty(window.location, 'hostname', {
        get: () => {
          throw new Error('Location error');
        },
        configurable: true,
      });

      const result = await openLeaderboard(undefined);
      expect(result.success).toBe(false);
    });
  });
});
