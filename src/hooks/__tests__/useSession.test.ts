import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from '../useSession';
import { supabase } from '../../utils/supabaseClient';
import { storageService, STORAGE_KEYS } from '../../services';
import type { Session, AuthError } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    get: vi.fn(),
  },
  STORAGE_KEYS: {
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
    data: {
      subscription: {
        id: 'mock-sub',
        callback: () => {},
        unsubscribe: mockUnsubscribe,
      },
    },
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(mockOnAuthStateChange);
  });

  it('should initialize with loading state', () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    vi.mocked(storageService.get).mockReturnValue(null);

    const { result } = renderHook(() => useSession());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return local session when available', async () => {
    const localSessionData = {
      userId: 'local-user-123',
      isAdmin: false,
    };

    vi.mocked(storageService.get).mockReturnValue(JSON.stringify(localSessionData));
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

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

    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSupabaseSession },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('supabase-user-123');
  });

  it('should return null session when neither local nor Supabase session exists', async () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('should register auth state change listener', () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    renderHook(() => useSession());

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });
});
