import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSession } from '../useSession';
import { authApi } from '../../utils/api';
import { storage, StorageKeys } from '../../utils/storage';
import type { Session } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('../../utils/api', () => ({
  authApi: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    getString: vi.fn(),
  },
  StorageKeys: {
    LOCAL_SESSION: 'solve-climb-local-session',
  },
}));

vi.mock('../../utils/safeJsonParse', () => ({
  parseLocalSession: vi.fn((str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }),
}));

describe('useSession', () => {
  const mockUnsubscribe = vi.fn();
  const mockOnAuthStateChange = vi.fn(() => ({
    unsubscribe: mockUnsubscribe,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.onAuthStateChange).mockImplementation(mockOnAuthStateChange);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(authApi.getSession).mockResolvedValue(null);
    vi.mocked(storage.getString).mockReturnValue(null);

    const { result } = renderHook(() => useSession());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return local session when available', async () => {
    const localSessionData = {
      userId: 'local-user-123',
      isAdmin: false,
    };

    vi.mocked(storage.getString).mockReturnValue(JSON.stringify(localSessionData));
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('local-user-123');
    expect(result.current.isAdmin).toBe(false);
  });

  it('should return Supabase session when available', async () => {
    const mockSupabaseSession: Session = {
      user: {
        id: 'supabase-user-123',
        email: 'test@example.com',
        user_metadata: {
          isAdmin: false,
        },
      },
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
    } as unknown as Session;

    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(mockSupabaseSession);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('supabase-user-123');
  });

  it('should return null session when neither local nor Supabase session exists', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('should detect admin user from local session', async () => {
    const localSessionData = {
      userId: 'admin-user-123',
      isAdmin: true,
    };

    vi.mocked(storage.getString).mockReturnValue(JSON.stringify(localSessionData));
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should detect admin user from Supabase session', async () => {
    const mockSupabaseSession: Session = {
      user: {
        id: 'admin-user-123',
        email: 'admin@example.com',
        user_metadata: {
          isAdmin: true,
        },
      },
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
    } as unknown as Session;

    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(mockSupabaseSession);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should register auth state change listener', () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    renderHook(() => useSession());

    expect(authApi.onAuthStateChange).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    const { unmount } = renderHook(() => useSession());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update session when auth state changes', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    let authStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
    vi.mocked(authApi.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return { unsubscribe: mockUnsubscribe };
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newSession: Session = {
      user: {
        id: 'new-user-123',
        email: 'new@example.com',
        user_metadata: {},
      },
      access_token: 'new-token',
      refresh_token: 'new-refresh',
      expires_in: 3600,
      token_type: 'bearer',
    } as unknown as Session;

    act(() => {
      if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_IN', newSession);
      }
    });

    await waitFor(() => {
      expect(result.current.userId).toBe('new-user-123');
    });
  });

  it('should handle local session parse failure', async () => {
    vi.mocked(storage.getString).mockReturnValue('invalid json');
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  it('should handle Supabase getSession error', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockRejectedValue(new Error('Session error'));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it('should check local session when auth state changes to null', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    let authStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
    vi.mocked(authApi.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return { unsubscribe: mockUnsubscribe };
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set up local session
    const localSessionData = {
      userId: 'local-user-123',
      isAdmin: false,
    };
    vi.mocked(storage.getString).mockReturnValue(JSON.stringify(localSessionData));

    act(() => {
      if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_OUT', null);
      }
    });

    await waitFor(() => {
      expect(result.current.userId).toBe('local-user-123');
    });
  });

  it('should handle auth state change with new session', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(authApi.getSession).mockResolvedValue(null);

    let authStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
    vi.mocked(authApi.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return { unsubscribe: mockUnsubscribe };
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newSession: Session = {
      user: {
        id: 'new-user-456',
        email: 'new@example.com',
        user_metadata: { isAdmin: false },
      },
      access_token: 'new-token',
      refresh_token: 'new-refresh',
      expires_in: 3600,
      token_type: 'bearer',
    } as unknown as Session;

    act(() => {
      if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_IN', newSession);
      }
    });

    await waitFor(() => {
      expect(result.current.userId).toBe('new-user-456');
      expect(result.current.session).toBe(newSession);
    });
  });
});

