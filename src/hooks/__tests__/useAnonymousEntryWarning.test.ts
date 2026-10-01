import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnonymousEntryWarning, SESSION_ENTRY_KEY } from '../useAnonymousEntryWarning';
import { useAuthStore } from '@/stores/useAuthStore';
import { storageService, STORAGE_KEYS } from '@/services';
import type { User } from '@supabase/supabase-js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useAnonymousEntryWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore.setState({
      session: null,
      user: null,
      isLoading: false,
    });
  });

  it('should not open modal for authenticated google user and should clear counter', () => {
    storageService.set(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT, 2);
    useAuthStore.setState({
      user: {
        id: 'google-user-1',
        email: 'user@gmail.com',
        is_anonymous: false,
      } as unknown as User,
    });

    const { result } = renderHook(() => useAnonymousEntryWarning());

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isAnonymous).toBe(false);
    expect(storageService.get(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT)).toBeNull();
  });

  it('should increment count to 1 and not open modal on 1st anonymous entry', () => {
    useAuthStore.setState({
      user: {
        id: 'anon-user-1',
        email: null,
        is_anonymous: true,
      } as unknown as User,
    });

    const { result } = renderHook(() => useAnonymousEntryWarning());

    expect(storageService.get(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT)).toBe(1);
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isAnonymous).toBe(true);
  });

  it('should not increment count on subsequent renders in same session', () => {
    useAuthStore.setState({
      user: {
        id: 'anon-user-1',
        email: null,
        is_anonymous: true,
      } as unknown as User,
    });

    renderHook(() => useAnonymousEntryWarning());
    expect(storageService.get(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT)).toBe(1);

    // Second render in same session (sessionStorage flag present)
    renderHook(() => useAnonymousEntryWarning());
    expect(storageService.get(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT)).toBe(1);
  });

  it('should open modal on 3rd entry for anonymous user', () => {
    storageService.set(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT, 2);
    useAuthStore.setState({
      user: {
        id: 'anon-user-1',
        email: null,
        is_anonymous: true,
      } as unknown as User,
    });

    const { result } = renderHook(() => useAnonymousEntryWarning());

    expect(storageService.get(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT)).toBe(3);
    expect(result.current.isModalOpen).toBe(true);
  });

  it('should open modal on 6th entry for anonymous user', () => {
    storageService.set(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT, 5);
    useAuthStore.setState({
      user: {
        id: 'anon-user-1',
        email: null,
        is_anonymous: true,
      } as unknown as User,
    });

    const { result } = renderHook(() => useAnonymousEntryWarning());

    expect(storageService.get(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT)).toBe(6);
    expect(result.current.isModalOpen).toBe(true);
  });

  it('should close modal when closeModal is called', () => {
    storageService.set(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT, 2);
    useAuthStore.setState({
      user: {
        id: 'anon-user-1',
        email: null,
        is_anonymous: true,
      } as unknown as User,
    });

    const { result } = renderHook(() => useAnonymousEntryWarning());
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('should navigate to /my-page and close modal when handleGoToMyPage is called', () => {
    storageService.set(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT, 2);
    useAuthStore.setState({
      user: {
        id: 'anon-user-1',
        email: null,
        is_anonymous: true,
      } as unknown as User,
    });

    const { result } = renderHook(() => useAnonymousEntryWarning());

    act(() => {
      result.current.handleGoToMyPage();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith('/my-page');
  });
});
