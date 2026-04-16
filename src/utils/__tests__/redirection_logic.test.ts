import { describe, it, vi, beforeEach, afterEach } from 'vitest';

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
    if (ENV.VITE_SITE_URL !== 'https://test-site.vercel.app') {
      throw new Error('Mock failed');
    }
  });
});
