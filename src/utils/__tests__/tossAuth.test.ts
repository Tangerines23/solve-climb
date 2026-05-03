import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTossUserInfo, createOrUpdateSupabaseUser, handleTossLoginFlow } from '../tossAuth';
import { ENV } from '../env';
import { supabase } from '../supabaseClient';

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
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
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
      vi.mocked(ENV).VITE_SUPABASE_URL = '';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = '';

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow('환경 변수');
    });

    it('should handle missing SUPABASE_URL', async () => {
      vi.mocked(ENV).VITE_SUPABASE_URL = '';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = 'test-key';

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow('환경 변수');
    });

    it('should handle missing SUPABASE_ANON_KEY', async () => {
      vi.mocked(ENV).VITE_SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = '';

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow('환경 변수');
    });

    it('should handle Edge Function call failure', async () => {
      vi.mocked(ENV).VITE_SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = 'test-key';

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Edge Function error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow();
    });

    it('should handle network error in Edge Function call', async () => {
      vi.mocked(ENV).VITE_SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = 'test-key';

      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow();
    });

    it('should remove trailing slash from SUPABASE_URL', async () => {
      vi.mocked(ENV).VITE_SUPABASE_URL = 'https://test.supabase.co/';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = 'test-key';

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(createOrUpdateSupabaseUser('test-token')).rejects.toThrow();

      // Verify URL was constructed correctly
      const [firstArg] = fetchMock.mock.calls[0];
      const request = firstArg as Request;
      expect(request.url).toContain('https://test.supabase.co/functions/v1/toss-auth');
    });
  });

  describe('handleTossLoginFlow', () => {
    const mockAuthCode = 'test-code';
    const mockReferrer = 'test-referrer';

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(ENV).VITE_SUPABASE_URL = 'https://test.supabase.co';
      vi.mocked(ENV).VITE_SUPABASE_ANON_KEY = 'test-key';
    });

    it('should complete full login flow successfully', async () => {
      // 1. OAuth Result
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            accessToken: 'toss-access-token',
          }),
          { status: 200 }
        )
      );

      // 2. User Update Result
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            user: { id: 'user-123' },
            loginInfo: { email: 'test@example.com', password: 'password123' },
          }),
          { status: 200 }
        )
      );

      // 3. Supabase Sign In
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: { access_token: 'sb-token', refresh_token: 'sb-refresh' } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>);

      const result = await handleTossLoginFlow(mockAuthCode, mockReferrer);

      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should handle 401 error with specific details', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            message: 'Unauthorized',
            details: { hint: 'Check your API keys' },
          }),
          { status: 401 }
        )
      );

      await expect(handleTossLoginFlow(mockAuthCode, mockReferrer)).rejects.toThrow(
        '토스 API 인증에 실패했습니다.'
      );
    });

    it('should handle 401 error with full details', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            message: 'Unauthorized',
            details: {
              hint: 'Secret Missing',
              checkSecrets: 'Check ENV',
              tossApiError: { message: 'Toss Internal error' },
            },
          }),
          { status: 401 }
        )
      );

      const result = handleTossLoginFlow(mockAuthCode, mockReferrer);
      await expect(result).rejects.toThrow(/Secret Missing/);
      await expect(result).rejects.toThrow(/Check ENV/);
      await expect(result).rejects.toThrow(/Toss Internal error/);
    });

    it('should handle 400 error without dev mode', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Bad Request',
          }),
          { status: 400 }
        )
      );

      await expect(handleTossLoginFlow('REAL_CODE', mockReferrer)).rejects.toThrow(
        /AccessToken 요청 실패 \(400\)/
      );
    });

    it('should handle generic error status', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Server Error',
          }),
          { status: 500 }
        )
      );

      await expect(handleTossLoginFlow(mockAuthCode, mockReferrer)).rejects.toThrow(
        /AccessToken 요청 실패 \(500\)/
      );
    });

    it('should handle non-JSON error response', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Internal Server Error Text', { status: 500 }));

      await expect(handleTossLoginFlow(mockAuthCode, mockReferrer)).rejects.toThrow(
        /Internal Server Error Text/
      );
    });

    it('should handle response with success: false', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Custom Error',
          }),
          { status: 200 }
        )
      );

      await expect(handleTossLoginFlow(mockAuthCode, mockReferrer)).rejects.toThrow('Custom Error');
    });

    it('should handle JSON parse error in handleTossLoginFlow', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('invalid json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(handleTossLoginFlow(mockAuthCode, mockReferrer)).rejects.toThrow(
        '응답 파싱 실패'
      );
    });

    it('should handle 400 error with dev mode message', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Invalid Code',
          }),
          { status: 400 }
        )
      );

      await expect(handleTossLoginFlow('DEV_MODE_CODE', mockReferrer)).rejects.toThrow('개발 모드');
    });

    it('should handle network failure during OAuth', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(handleTossLoginFlow(mockAuthCode, mockReferrer)).rejects.toThrow(
        'Edge Function에 연결할 수 없습니다.'
      );
    });
  });
});
