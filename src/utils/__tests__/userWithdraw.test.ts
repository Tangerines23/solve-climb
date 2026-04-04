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

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: {
    getState: vi.fn(() => ({
      clearProfile: vi.fn(),
    })),
  },
}));

vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: {
    getState: vi.fn(() => ({
      resetProgress: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should successfully withdraw account when session exists', async () => {
    const mockSession = { access_token: 'test-token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    const result = await withdrawAccount();

    expect(result).toBe(true);
    // When fetch is called with a Request object instead of (url, options)
    const [call] = fetchMock.mock.calls;
    const request = call[0] as Request;
    expect(request.url).toContain('/functions/v1/withdraw-account');
    expect(request.method).toBe('POST');
    expect(request.headers.get('Authorization')).toBe('Bearer test-token');

    expect(storageService.clear).toHaveBeenCalled();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should skip server request if no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const result = await withdrawAccount();

    expect(result).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storageService.clear).toHaveBeenCalled();
  });

  it('should throw error if server request fails', async () => {
    const mockSession = { access_token: 'test-token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    // MSW will sometimes interfere with manually mocked Response objects if they don't look "real"
    // Use a standard Response constructor
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(withdrawAccount()).rejects.toThrow(
      '계정 삭제 요청 중 오류가 발생했습니다. 네트워크 상태를 확인하시거나 다시 시도해 주세요.'
    );
  });

  it('should handle network timeout/error', async () => {
    const mockSession = { access_token: 'test-token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    fetchMock.mockRejectedValue(new Error('Network error'));

    await expect(withdrawAccount()).rejects.toThrow('네트워크 상태를 확인하시거나');
  });

  it('should handle store reset failure gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const resetProgress = vi.fn().mockRejectedValue(new Error('Reset fail'));
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      resetProgress,
    } as any);

    const result = await withdrawAccount();

    expect(result).toBe(true); // Should still return true as it catches the error
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
