import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTossUserInfo, createOrUpdateSupabaseUser } from '../tossAuth';
import { ENV } from '../env';

// Mock dependencies
vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

vi.mock('../env', () => ({
  ENV: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-key',
  },
  logEnvInfo: vi.fn(),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('tossAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTossUserInfo', () => {
    it('should fetch user info from Toss API', async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            resultType: 'SUCCESS',
            success: {
              userKey: 12345,
              ci: 'test-ci',
              name: 'Test User',
              phone: '010-1234-5678',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const result = await getTossUserInfo('test-token');

      expect(result).toBeTruthy();
      expect(result?.userKey).toBe(12345);
      expect(result?.name).toBe('Test User');
    });

    it('should handle API error', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(getTossUserInfo('test-token')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(getTossUserInfo('test-token')).rejects.toThrow();
    });

    it('should return null when resultType is not SUCCESS', async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            resultType: 'FAILURE',
            success: null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const result = await getTossUserInfo('test-token');

      expect(result).toBeNull();
    });

    it('should handle optional fields in user info', async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            resultType: 'SUCCESS',
            success: {
              userKey: 12345,
              ci: '',
              name: '',
              phone: '',
              birthday: '1990-01-01',
              gender: 'M',
              nationality: 'KR',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const result = await getTossUserInfo('test-token');

      expect(result).toBeTruthy();
      expect(result?.birthday).toBe('1990-01-01');
      expect(result?.gender).toBe('M');
      expect(result?.nationality).toBe('KR');
    });

    it('should handle JSON parse error in error response', async () => {
      fetchMock.mockResolvedValue(
        new Response(null, {
          status: 500,
        })
      );
      // Simulate JSON error by mocking json() to throw
      const response = (await fetchMock()) as Response;
      vi.spyOn(response, 'json').mockRejectedValue(new Error('Invalid JSON'));
      fetchMock.mockResolvedValue(response);

      await expect(getTossUserInfo('test-token')).rejects.toThrow();
    });
  });

  describe('createOrUpdateSupabaseUser', () => {
    it('should throw error when environment variables are missing', async () => {
      vi.mocked(ENV).SUPABASE_URL = '';
      vi.mocked(ENV).SUPABASE_ANON_KEY = '';

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow('환경 변수');
    });

    it('should handle missing SUPABASE_URL', async () => {
      vi.mocked(ENV).SUPABASE_URL = '';
      vi.mocked(ENV).SUPABASE_ANON_KEY = 'test-key';

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow('환경 변수');
    });

    it('should handle missing SUPABASE_ANON_KEY', async () => {
      vi.mocked(ENV).SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).SUPABASE_ANON_KEY = '';

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow('환경 변수');
    });

    it('should handle Edge Function call failure', async () => {
      vi.mocked(ENV).SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).SUPABASE_ANON_KEY = 'test-key';

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Edge Function error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow();
    });

    it('should handle network error in Edge Function call', async () => {
      vi.mocked(ENV).SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).SUPABASE_ANON_KEY = 'test-key';

      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow();
    });

    it('should remove trailing slash from SUPABASE_URL', async () => {
      vi.mocked(ENV).SUPABASE_URL = 'https://test.supabase.co/';
      vi.mocked(ENV).SUPABASE_ANON_KEY = 'test-key';

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow();

      // Verify URL was constructed correctly
      const [firstArg] = fetchMock.mock.calls[0];
      const calledUrl = typeof firstArg === 'string' ? firstArg : firstArg.url;
      expect(calledUrl).toContain('https://test.supabase.co/functions/v1/toss-auth');
    });
  });
});
