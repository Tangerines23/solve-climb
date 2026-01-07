import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENV } from '../env';

// Mock createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInAnonymously: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
  })),
}));

// Mock env
vi.mock('../env', () => ({
  ENV: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-key',
    IS_DEVELOPMENT: false,
  },
  logEnvInfo: vi.fn(),
}));

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create supabase client', async () => {
    // Dynamic import to test module initialization
    const { supabase } = await import('../supabaseClient');
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should handle missing environment variables', async () => {
    // Mock ENV with missing values
    vi.mocked(ENV).SUPABASE_URL = '';
    vi.mocked(ENV).SUPABASE_ANON_KEY = '';

    // Re-import to test fallback behavior
    const { supabase } = await import('../supabaseClient');
    expect(supabase).toBeDefined();
  });
});

