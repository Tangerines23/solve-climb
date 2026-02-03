import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitScoreToLeaderboard, openLeaderboard } from '../tossGameCenter';

// @apps-in-toss/web-framework 제거 시 mock 제거. 패키지 복구 시 mock 및 기대값 복구.
// vi.mock('@apps-in-toss/web-framework', () => ({ ... }));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
  getUserErrorMessage: vi.fn((error: unknown) => (error as Error)?.message || 'Unknown error'),
}));

function setupTossAppEnvironment() {
  (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView = {};
  Object.defineProperty(window, 'location', {
    value: { hostname: 'example.com', href: 'https://example.com' },
    writable: true,
    configurable: true,
  });
}

function setupLocalDevEnvironment() {
  delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  Object.defineProperty(window, 'location', {
    value: { hostname: 'localhost', href: 'http://localhost:5173' },
    writable: true,
    configurable: true,
  });
}

function setupBrowserEnvironment() {
  delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  Object.defineProperty(window, 'location', {
    value: { hostname: 'example.com', href: 'https://example.com' },
    writable: true,
    configurable: true,
  });
}

describe('tossGameCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupBrowserEnvironment();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitScoreToLeaderboard', () => {
    it('should simulate submission in localhost environment', async () => {
      setupLocalDevEnvironment();

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(true);
    });

    it('should simulate submission in 127.0.0.1 environment', async () => {
      delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1', href: 'http://127.0.0.1:5173' },
        writable: true,
        configurable: true,
      });

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(true);
    });

    it('should return false when not in Toss app environment (browser)', async () => {
      setupBrowserEnvironment();

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });

    it('should return false when in Toss app (web-framework 비활성)', async () => {
      setupTossAppEnvironment();

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });
  });

  describe('openLeaderboard', () => {
    it('should return failure with message in local dev environment', async () => {
      setupLocalDevEnvironment();
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toBe('토스 앱에서만 리더보드를 볼 수 있습니다.');
      expect(onError).toHaveBeenCalledWith('토스 앱에서만 리더보드를 볼 수 있습니다.');
    });

    it('should return failure when not in Toss app environment (browser)', async () => {
      setupBrowserEnvironment();
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toBe('토스 앱에서만 리더보드를 볼 수 있습니다.');
      expect(onError).toHaveBeenCalled();
    });

    it('should return stub failure when in Toss app (web-framework 비활성)', async () => {
      setupTossAppEnvironment();
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('비활성화');
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('비활성화'));
    });

    it('should work correctly when onError callback is not provided', async () => {
      setupBrowserEnvironment();

      const result = await openLeaderboard();

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});
