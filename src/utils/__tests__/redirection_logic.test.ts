import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ENV before importing modules that use it
vi.mock('@/utils/env', () => ({
  ENV: {
    VITE_SITE_URL: 'https://test-site.vercel.app',
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'dummy-key',
  },
  logEnvInfo: vi.fn(),
}));

describe('Redirection logic with VITE_SITE_URL', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:5173',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('should verify environment mock is working', async () => {
    // Re-import to use the mock
    const { ENV } = await import('../env');
    expect(ENV.VITE_SITE_URL).toBe('https://test-site.vercel.app');
  });

  it('should prioritize VITE_SITE_URL over window.location.origin', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    // Import the client which uses getRedirectUrl internally
    await import('../supabaseClient');

    // The console.log in createSupabaseClient should have been called with the correct URL
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Supabase] 콜백 URL:',
      'https://test-site.vercel.app/auth/callback'
    );

    consoleSpy.mockRestore();
  });
});
