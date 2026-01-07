import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTossUserInfo } from '../tossAuth';

// Mock dependencies
vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

global.fetch = vi.fn();

describe('tossAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTossUserInfo', () => {
    it('should fetch user info from Toss API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          resultType: 'SUCCESS',
          success: {
            userKey: 12345,
            ci: 'test-ci',
            name: 'Test User',
            phone: '010-1234-5678',
          },
        }),
      } as Response);

      const result = await getTossUserInfo('test-token');

      expect(result).toBeTruthy();
      expect(result?.userKey).toBe(12345);
      expect(result?.name).toBe('Test User');
    });

    it('should handle API error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      } as Response);

      await expect(getTossUserInfo('test-token')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(getTossUserInfo('test-token')).rejects.toThrow();
    });
  });
});

