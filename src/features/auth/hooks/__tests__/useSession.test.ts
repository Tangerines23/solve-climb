import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSession } from '../useSession';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Session, User } from '@supabase/supabase-js';

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      session: null,
      user: null,
      isLoading: false,
    });
    useProfileStore.setState({
      isAdmin: false,
    });
  });

  it('should reflect loading state from useAuthStore', () => {
    useAuthStore.setState({ isLoading: true });

    const { result } = renderHook(() => useSession());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return guest/local user session when available in useAuthStore', () => {
    const mockGuestUser = {
      id: 'local-user-123',
      user_metadata: { isAdmin: false },
    } as unknown as User;

    useAuthStore.setState({
      session: null,
      user: mockGuestUser,
      isLoading: false,
    });

    const { result } = renderHook(() => useSession());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('local-user-123');
    expect(result.current.isAdmin).toBe(false);
  });

  it('should return Supabase session when available in useAuthStore', () => {
    const mockSupabaseSession: Session = {
      user: {
        id: 'supabase-user-123',
        email: 'test@example.com',
        user_metadata: { isAdmin: false },
      },
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
    } as unknown as Session;

    useAuthStore.setState({
      session: mockSupabaseSession,
      user: mockSupabaseSession.user,
      isLoading: false,
    });

    const { result } = renderHook(() => useSession());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('supabase-user-123');
    expect(result.current.session).toBe(mockSupabaseSession);
  });

  it('should return null session when neither session nor user exists', () => {
    useAuthStore.setState({
      session: null,
      user: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useSession());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('should reflect admin status from useProfileStore', () => {
    useProfileStore.setState({ isAdmin: true });

    const { result } = renderHook(() => useSession());
    expect(result.current.isAdmin).toBe(true);
  });
});
