import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyRewardStore } from '../useDailyRewardStore';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase and debugFetch
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn((query) => query),
}));

describe('useDailyRewardStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDailyRewardStore.setState({
      rewardResult: null,
      isLoading: false,
      showModal: false,
    });
  });

  it('should start loading when checking daily login', async () => {
    vi.mocked(supabase.auth.getSession).mockReturnValue(new Promise(() => {}) as any); // Hang to check loading state

    const { result } = renderHook(() => useDailyRewardStore());
    act(() => {
      result.current.checkDailyLogin();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should not show modal if no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useDailyRewardStore());
    await act(async () => {
      await result.current.checkDailyLogin();
    });

    expect(result.current.showModal).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should show modal and set reward results on successful daily login RPC', async () => {
    const mockSession = { user: { id: 'test-user' } };
    const mockReward = { success: true, reward_minerals: 100, streak: 5, message: 'Success' };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockReward, error: null } as any);

    const { result } = renderHook(() => useDailyRewardStore());
    await act(async () => {
      await result.current.checkDailyLogin();
    });

    expect(result.current.showModal).toBe(true);
    expect(result.current.rewardResult).toEqual(mockReward);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not show modal if daily login already processed for today (success: false)', async () => {
    const mockSession = { user: { id: 'test-user' } };
    const mockResult = { success: false, message: 'Already received' };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResult, error: null } as any);

    const { result } = renderHook(() => useDailyRewardStore());
    await act(async () => {
      await result.current.checkDailyLogin();
    });

    expect(result.current.showModal).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle Supabase RPC errors gracefully without crashing', async () => {
    const mockSession = { user: { id: 'test-user' } };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Database Error' },
    } as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDailyRewardStore());
    await act(async () => {
      await result.current.checkDailyLogin();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showModal).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('RPC Error'),
      expect.anything()
    );

    consoleSpy.mockRestore();
  });

  it('should close modal and clear the reward result state', () => {
    useDailyRewardStore.setState({
      showModal: true,
      rewardResult: { success: true, message: 'Test' },
    });

    const { result } = renderHook(() => useDailyRewardStore());
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.showModal).toBe(false);
    expect(result.current.rewardResult).toBeNull();
  });
});
