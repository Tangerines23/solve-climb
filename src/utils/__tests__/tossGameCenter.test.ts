import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitScoreToLeaderboard } from '../tossGameCenter';
import { submitGameCenterLeaderBoardScore } from '@apps-in-toss/web-framework';

// Mock dependencies
vi.mock('@apps-in-toss/web-framework', () => ({
  submitGameCenterLeaderBoardScore: vi.fn(),
  openGameCenterLeaderboard: vi.fn(),
  isMinVersionSupported: vi.fn(() => true),
  getOperationalEnvironment: vi.fn(() => 'PRODUCTION'),
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
  getUserErrorMessage: vi.fn((error) => error.message),
}));

describe('tossGameCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      writable: true,
    });
  });

  describe('submitScoreToLeaderboard', () => {
    it('should simulate submission in local development', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(true);
    });

    it('should return false when not in Toss app environment', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });

    it('should handle submission error', async () => {
      (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });
      vi.mocked(submitGameCenterLeaderBoardScore).mockResolvedValue({
        statusCode: 'LEADERBOARD_NOT_FOUND',
      } as { statusCode: 'SUCCESS' | 'LEADERBOARD_NOT_FOUND' });

      const result = await submitScoreToLeaderboard(1000);

      expect(result).toBe(false);
    });
  });
});
