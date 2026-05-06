import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { supabase } from '../../utils/supabaseClient';
import { createAuthSessionMock } from '../../utils/__tests__/supabaseMockUtils';

// Mock types
declare global {
  var authCallback: ((event: any, session: any) => void) | undefined;
}

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn((cb) => {
        // Store the callback so we can trigger it in tests
        global.authCallback = cb;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
    },
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  STORAGE_KEYS: {
    LOCAL_SESSION: 'local-session',
  },
}));

vi.mock('@/services/analytics', () => ({
  analytics: {
    setUser: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      session: null,
      user: null,
      isLoading: false,
    });
  });

  it('should initialize with default values', () => {
    const { session, user, isLoading } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
    expect(isLoading).toBe(false);
  });

  it('should initialize and check session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(
      createAuthSessionMock({
        user: { id: '00000000-0000-0000-0000-000000000003' },
        access_token: 'token',
      })
    );

    await useAuthStore.getState().initialize();

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('should sign in anonymously when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(createAuthSessionMock(null));

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue(
      createAuthSessionMock({
        user: { id: '00000000-0000-0000-0000-000000000004' },
        access_token: 'token',
      })
    );

    await useAuthStore.getState().initialize();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
  });

  it('should handle manual anonymous sign-in', async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue(
      createAuthSessionMock({
        user: { id: '00000000-0000-0000-0000-000000000004' },
        access_token: 'token',
      })
    );

    await useAuthStore.getState().signInAnonymously();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    const { user } = useAuthStore.getState();
    expect(user).toBeTruthy();
  });

  it('should sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    await useAuthStore.getState().signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    const { session, user } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('should not sign in anonymously when session exists', async () => {
    const mockSession = {
      user: { id: '00000000-0000-0000-0000-000000000003' },
      access_token: 'token',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue(createAuthSessionMock(mockSession));

    await useAuthStore.getState().initialize();

    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('should handle anonymous sign-in error during initialize', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(createAuthSessionMock(null));

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue(
      createAuthSessionMock(null, { message: 'Sign-in failed' })
    );

    await useAuthStore.getState().initialize();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    const { session, user } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('should handle anonymous sign-in error during manual sign-in', async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue(
      createAuthSessionMock(null, { message: 'Sign-in failed' })
    );

    await useAuthStore.getState().signInAnonymously();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    const { session, user } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('should handle isLoading state during initialize', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(createAuthSessionMock(null));

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue(
      createAuthSessionMock({
        user: { id: '00000000-0000-0000-0000-000000000004' },
        access_token: 'token',
      })
    );

    const initializePromise = useAuthStore.getState().initialize();

    // isLoading should be true during initialization
    expect(useAuthStore.getState().isLoading).toBe(true);

    await initializePromise;

    // isLoading should be false after initialization
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should handle isLoading state during signInAnonymously', async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue(
      createAuthSessionMock({
        user: { id: '00000000-0000-0000-0000-000000000004' },
        access_token: 'token',
      })
    );

    const signInPromise = useAuthStore.getState().signInAnonymously();

    // isLoading should be true during sign-in
    expect(useAuthStore.getState().isLoading).toBe(true);

    await signInPromise;

    // isLoading should be false after sign-in
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  describe('Session Recovery & Auth Changes', () => {
    it('should recover session from local storage', async () => {
      const { storageService, STORAGE_KEYS } = await import('../../services');
      vi.mocked(storageService.get).mockReturnValue({
        userId: '00000000-0000-0000-0000-000000000005',
      });

      vi.mocked(supabase.auth.getSession).mockResolvedValue(createAuthSessionMock(null));

      await useAuthStore.getState().initialize();

      const { user } = useAuthStore.getState();
      expect(user?.id).toBe('00000000-0000-0000-0000-000000000005');
      expect(user?.is_anonymous).toBe(true);
    });

    it('should handle auth state change events', async () => {
      await useAuthStore.getState().initialize();
      const callback = global.authCallback;
      expect(callback).toBeDefined();

      // Trigger signed in
      const mockSession = { user: { id: '00000000-0000-0000-0000-000000000006' } };
      callback('SIGNED_IN', mockSession);

      expect(useAuthStore.getState().user?.id).toBe('00000000-0000-0000-0000-000000000006');

      // Trigger signed out
      callback('SIGNED_OUT', null);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should maintain anonymous session on INITIAL_SESSION or MFA_CHALLENGE with null session', async () => {
      // Ensure no local session to interfere
      const { storageService } = await import('../../services');
      vi.mocked(storageService.get).mockReturnValue(null);

      // Setup: existing anonymous session
      const anonId = '00000000-0000-0000-0000-000000000007';
      const mockAuth = createAuthSessionMock({ user: { id: anonId, is_anonymous: true } });
      useAuthStore.setState({
        session: mockAuth.data.session,
        user: mockAuth.data.user,
      });

      await useAuthStore.getState().initialize();
      const callback = global.authCallback;

      // Trigger INITIAL_SESSION with null session
      callback('INITIAL_SESSION', null);

      // Should NOT clear session (stay as anon)
      expect(useAuthStore.getState().user?.id).toBe(anonId);

      // Trigger MFA_CHALLENGE with null session
      callback('MFA_CHALLENGE', null);
      expect(useAuthStore.getState().user?.id).toBe(anonId);

      // But SIGNED_OUT should clear it
      callback('SIGNED_OUT', null);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should synchronize analytics user on auth change', async () => {
      const { analytics } = await import('@/services/analytics');
      await useAuthStore.getState().initialize();
      const callback = global.authCallback;

      const mockUser = {
        id: '00000000-0000-0000-0000-000000000008',
        email: 'test@example.com',
        last_sign_in_at: '2023-01-01',
      };
      callback('SIGNED_IN', { user: mockUser });

      // No longer needs complex vi.waitFor since the import is static and execution is immediate
      expect(analytics.setUser).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000008', {
        email: 'test@example.com',
        last_sign_in: '2023-01-01',
      });
    });
  });
});
