import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSession } from '../useSession';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Session, User } from '@supabase/supabase-js';

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

describe('useSession', () => {
  it('should reflect loading state from useAuthStore', () => {
    useAuthStore.setState({ session: null, user: null, isLoading: true });
    const { result } = renderHook(() => useSession());
    expect(result.current.isLoading).toBe(true);
  });

  it('should return guest/local user session when available in useAuthStore (isAnonymous: true, isAuthenticated: true)', () => {
    const mockUser: User = {
      id: '1',
      email: 'guest@example.com',
      is_anonymous: true,
      app_metadata: {},
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.session).toEqual({ user: mockUser });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAnonymous).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return Supabase session and user when available in useAuthStore (isAuthenticated: true)', () => {
    const mockUser: User = {
      id: '1',
      email: 'user@example.com',
      is_anonymous: false,
      app_metadata: {},
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.session).toEqual({ user: mockUser });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAnonymous).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should identify anonymous user correctly when user.is_anonymous is true', () => {
    const mockUser: User = {
      id: '1',
      email: 'guest@example.com',
      is_anonymous: true,
      app_metadata: {},
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isAnonymous).toBe(true);
  });

  it('should return null session and null user when neither session nor user exists (isAuthenticated: false, userId: null)', () => {
    useAuthStore.setState({ session: null, user: null, isLoading: false });
    const { result } = renderHook(() => useSession());
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  it('should reflect admin status when useProfileStore.isAdmin is true', () => {
    const mockUser: User = {
      id: '1',
      email: 'admin@example.com',
      is_anonymous: false,
      app_metadata: {},
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    useProfileStore.setState({ isAdmin: true });
    const { result } = renderHook(() => useSession());
    expect(result.current.isAdmin).toBe(true);
  });

  it('should reflect admin status when app_metadata.role is "admin"', () => {
    const mockUser: User = {
      id: '1',
      email: 'admin@example.com',
      is_anonymous: false,
      app_metadata: { role: 'admin' },
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isAdmin).toBe(true);
  });

  it('should reflect admin status when app_metadata.isAdmin is true', () => {
    const mockUser: User = {
      id: '1',
      email: 'admin@example.com',
      is_anonymous: false,
      app_metadata: { isAdmin: true },
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isAdmin).toBe(true);
  });

  it('should reflect admin status when user_metadata.isAdmin is true', () => {
    const mockUser: User = {
      id: '1',
      email: 'admin@example.com',
      is_anonymous: false,
      app_metadata: {},
      user_metadata: { isAdmin: true },
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isAdmin).toBe(true);
  });

  it('should return isAdmin false for standard non-admin users', () => {
    const mockUser: User = {
      id: '1',
      email: 'user@example.com',
      is_anonymous: false,
      app_metadata: {},
      user_metadata: {},
    } as unknown as User;
    useAuthStore.setState({
      session: { user: mockUser } as Session,
      user: mockUser,
      isLoading: false,
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.isAdmin).toBe(false);
  });
});
