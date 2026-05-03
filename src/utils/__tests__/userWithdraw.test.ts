import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withdrawAccount } from '../userWithdraw';
import { supabase } from '../supabaseClient';
import { storageService, STORAGE_KEYS } from '../../services';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { ENV } from '../env';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    clear: vi.fn(),
    remove: vi.fn(),
  },
  STORAGE_KEYS: {
    LOCAL_SESSION: 'solve-climb-session',
  },
}));

vi.mock('../../stores/useProfileStore', () => {
  const mockStore = vi.fn((selector) => {
    const state = { clearProfile: vi.fn() };
    return typeof selector === 'function' ? selector(state) : state;
  });
  Object.assign(mockStore, { getState: vi.fn(() => ({ clearProfile: vi.fn() })) });
  return { useProfileStore: mockStore };
});

vi.mock('../../stores/useLevelProgressStore', () => {
  const mockStore = vi.fn((selector) => {
    const state = { resetProgress: vi.fn().mockResolvedValue(undefined) };
    return typeof selector === 'function' ? selector(state) : state;
  });
  Object.assign(mockStore, {
    getState: vi.fn(() => ({ resetProgress: vi.fn().mockResolvedValue(undefined) })),
  });
  return { useLevelProgressStore: mockStore };
});

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

vi.mock('../env', () => ({
  ENV: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('userWithdraw', () => {
  const mockClearProfile = vi.fn();
  const mockResetProgress = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should successfully withdraw account when session exists', async () => {
    const mockSession = { access_token: 'test-token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as unknown as { data: { session: unknown }; error: null });

    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    const result = await withdrawAccount(mockClearProfile, mockResetProgress);

    expect(result).toBe(true);
    const [call] = fetchMock.mock.calls;
    const request = call[0] as Request;
    expect(request.url).toContain('/functions/v1/withdraw-account');
    expect(request.method).toBe('POST');
    expect(request.headers.get('Authorization')).toBe('Bearer test-token');

    expect(storageService.clear).toHaveBeenCalled();
    expect(mockClearProfile).toHaveBeenCalled();
    expect(mockResetProgress).toHaveBeenCalled();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should skip server request if no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as unknown as { data: { session: unknown }; error: null });

    const result = await withdrawAccount(mockClearProfile, mockResetProgress);

    expect(result).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storageService.clear).toHaveBeenCalled();
    expect(mockClearProfile).toHaveBeenCalled();
    expect(mockResetProgress).toHaveBeenCalled();
  });

  it('should throw error if server request fails', async () => {
    const mockSession = { access_token: 'test-token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as unknown as { data: { session: unknown }; error: null });

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(withdrawAccount(mockClearProfile, mockResetProgress)).rejects.toThrow(
      '계정 삭제 요청 중 오류가 발생했습니다. 네트워크 상태를 확인하시거나 다시 시도해 주세요.'
    );
  });

  it('should handle network timeout/error', async () => {
    const mockSession = { access_token: 'test-token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as unknown as { data: { session: unknown }; error: null });

    fetchMock.mockRejectedValue(new Error('Network error'));

    await expect(withdrawAccount(mockClearProfile, mockResetProgress)).rejects.toThrow(
      '네트워크 상태를 확인하시거나'
    );
  });

  it('should handle store reset failure gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as unknown as { data: { session: unknown }; error: null });

    const failingResetProgress = vi.fn().mockRejectedValue(new Error('Reset fail'));
    const result = await withdrawAccount(mockClearProfile, failingResetProgress);

    expect(result).toBe(true); // Should still return true as it catches the error
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
