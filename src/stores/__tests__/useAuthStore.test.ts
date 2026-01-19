import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
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
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
          access_token: 'token',
        },
      },
      error: null,
    } as never);

    await useAuthStore.getState().initialize();

    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('should sign in anonymously when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: {
        session: {
          user: { id: 'anon-user' },
          access_token: 'token',
        },
        user: { id: 'anon-user' },
      },
      error: null,
    } as never);

    await useAuthStore.getState().initialize();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
  });

  it('should handle manual anonymous sign-in', async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: {
        session: {
          user: { id: 'anon-user' },
          access_token: 'token',
        },
        user: { id: 'anon-user' },
      },
      error: null,
    } as never);

    await useAuthStore.getState().signInAnonymously();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    const { user } = useAuthStore.getState();
    expect(user).toBeTruthy();
  });

  it('should sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    } as never);

    await useAuthStore.getState().signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    const { session, user } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('should not sign in anonymously when session exists', async () => {
    const mockSession = {
      user: { id: 'test-user' },
      access_token: 'token',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never);

    await useAuthStore.getState().initialize();

    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('should handle anonymous sign-in error during initialize', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Sign-in failed' },
    } as never);

    await useAuthStore.getState().initialize();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    const { session, user } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('should handle anonymous sign-in error during manual sign-in', async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Sign-in failed' },
    } as never);

    await useAuthStore.getState().signInAnonymously();

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    const { session, user } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('should handle isLoading state during initialize', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: {
        session: {
          user: { id: 'anon-user' },
          access_token: 'token',
        },
        user: { id: 'anon-user' },
      },
      error: null,
    } as never);

    const initializePromise = useAuthStore.getState().initialize();

    // isLoading should be true during initialization
    expect(useAuthStore.getState().isLoading).toBe(true);

    await initializePromise;

    // isLoading should be false after initialization
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should handle isLoading state during signInAnonymously', async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: {
        session: {
          user: { id: 'anon-user' },
          access_token: 'token',
        },
        user: { id: 'anon-user' },
      },
      error: null,
    } as never);

    const signInPromise = useAuthStore.getState().signInAnonymously();

    // isLoading should be true during sign-in
    expect(useAuthStore.getState().isLoading).toBe(true);

    await signInPromise;

    // isLoading should be false after sign-in
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
