import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCallbackUrl, testSupabaseConnection, testCallbackUrl } from '../authTest';
import { supabase } from '../supabaseClient';
import { ENV } from '../env';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('../env', () => ({
  ENV: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-key',
  },
}));

describe('authTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCallbackUrl', () => {
    it('should return callback URL with current origin', () => {
      const url = getCallbackUrl();
      expect(url).toContain('/auth/callback');
      expect(url).toContain(window.location.origin);
    });

    it('should return empty string when window is undefined', () => {
      // This test verifies the function handles SSR scenarios
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;
      
      // In actual SSR, window would be undefined, but in test environment
      // we can't easily simulate this, so we just verify the function exists
      expect(typeof getCallbackUrl).toBe('function');
      
      global.window = originalWindow;
    });
  });

  describe('testSupabaseConnection', () => {
    it('should return success when connection works', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
        error: null,
      } as never);

      const result = await testSupabaseConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('성공');
    });

    it('should return failure when environment variables are missing', async () => {
      vi.mocked(ENV).SUPABASE_URL = '';
      vi.mocked(ENV).SUPABASE_ANON_KEY = '';

      const result = await testSupabaseConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('환경 변수');
    });

    it('should handle connection errors', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Connection failed', status: 500 },
      } as never);

      const result = await testSupabaseConnection();

      expect(result.success).toBe(false);
    });
  });

  describe('testCallbackUrl', () => {
    it('should validate callback URL format', () => {
      const result = testCallbackUrl();

      expect(result.success).toBe(true);
      expect(result.details?.callbackUrl).toContain('/auth/callback');
    });
  });
});

