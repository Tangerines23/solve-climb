import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitScoreToLeaderboard, openLeaderboard } from '../tossGameCenter';
import {
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
  isMinVersionSupported,
  getOperationalEnvironment,
} from '@apps-in-toss/web-framework';

// Mock dependencies
vi.mock('@apps-in-toss/web-framework', () => ({
  submitGameCenterLeaderBoardScore: vi.fn(),
  openGameCenterLeaderboard: vi.fn(),
  isMinVersionSupported: vi.fn(() => true),
  getOperationalEnvironment: vi.fn(() => 'toss'),
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
  getUserErrorMessage: vi.fn((error) => error?.message || 'Unknown error'),
}));

// ============================================
// Helper Functions for Environment Simulation
// ============================================

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

// ============================================
// Test Suite
// ============================================

describe('tossGameCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default browser environment
    setupBrowserEnvironment();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // submitScoreToLeaderboard Tests
  // ========================================
  describe('submitScoreToLeaderboard', () => {
    it('should simulate submission in localhost environment', async () => {
      setupLocalDevEnvironment();

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(true);
      expect(submitGameCenterLeaderBoardScore).not.toHaveBeenCalled();
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

    it('should return true when SDK returns SUCCESS', async () => {
      setupTossAppEnvironment();
      vi.mocked(submitGameCenterLeaderBoardScore).mockResolvedValue({
        statusCode: 'SUCCESS',
      } as { statusCode: 'SUCCESS' | 'LEADERBOARD_NOT_FOUND' });

      const result = await submitScoreToLeaderboard(1500);

      expect(result).toBe(true);
      expect(submitGameCenterLeaderBoardScore).toHaveBeenCalledWith({
        score: '1500.0',
      });
    });

    it('should return false when SDK returns LEADERBOARD_NOT_FOUND', async () => {
      setupTossAppEnvironment();
      vi.mocked(submitGameCenterLeaderBoardScore).mockResolvedValue({
        statusCode: 'LEADERBOARD_NOT_FOUND',
      } as { statusCode: 'SUCCESS' | 'LEADERBOARD_NOT_FOUND' });

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });

    it('should return false when SDK returns null (unsupported version)', async () => {
      setupTossAppEnvironment();
      vi.mocked(submitGameCenterLeaderBoardScore).mockResolvedValue(
        null as unknown as { statusCode: 'SUCCESS' | 'LEADERBOARD_NOT_FOUND' }
      );

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });

    it('should handle exception and return false', async () => {
      setupTossAppEnvironment();
      vi.mocked(submitGameCenterLeaderBoardScore).mockRejectedValue(new Error('Network error'));

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });
  });

  // ========================================
  // openLeaderboard Tests
  // ========================================
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

    it('should return failure when app version is not supported', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(false);
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('최신 버전으로 업데이트');
      expect(onError).toHaveBeenCalled();
    });

    it('should return failure in sandbox environment', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('sandbox');
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('샌드박스 환경');
      expect(onError).toHaveBeenCalled();
    });

    it('should return failure when not in toss environment', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('unknown');
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('토스 앱에서 실행 중인지 확인');
      expect(onError).toHaveBeenCalled();
    });

    it('should call openGameCenterLeaderboard and return success in toss environment', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');

      const result = await openLeaderboard();

      expect(result.success).toBe(true);
      expect(result.message).toBeUndefined();
      expect(openGameCenterLeaderboard).toHaveBeenCalled();
    });

    it('should handle exception from openGameCenterLeaderboard', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw new Error('Bridge error');
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(onError).toHaveBeenCalled();
    });

    it('should work correctly when onError callback is not provided', async () => {
      setupBrowserEnvironment();

      const result = await openLeaderboard();

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should handle network error and return appropriate message', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw new Error('network connection failed');
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('네트워크');
    });

    it('should handle version error and return appropriate message', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw new Error('version not supported');
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('업데이트');
    });

    it('should handle leaderboard not found error', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw new Error('leaderboard not found');
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('리더보드를 찾을 수 없습니다');
    });

    it('should handle permission error', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw new Error('permission denied');
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('권한');
    });

    it('should handle timeout error', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      const timeoutError = new Error('operation timed out');
      timeoutError.name = 'TimeoutError';
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw timeoutError;
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toContain('시간이 초과');
    });

    it('should handle non-Error thrown value', async () => {
      setupTossAppEnvironment();
      vi.mocked(isMinVersionSupported).mockReturnValue(true);
      vi.mocked(getOperationalEnvironment).mockReturnValue('toss');
      vi.mocked(openGameCenterLeaderboard).mockImplementation(() => {
        throw 'string error';
      });
      const onError = vi.fn();

      const result = await openLeaderboard(onError);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});
