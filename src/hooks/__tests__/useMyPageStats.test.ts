import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMyPageStats } from '../useMyPageStats';
import { supabase } from '../../utils/supabaseClient';
import { storage } from '../../utils/storage';
import type { Subscription, PostgrestError } from '@supabase/supabase-js';
import { isLocalSession } from '../../utils/safeJsonParse';
import { StorageKeys } from '../../utils/storage';

// Helper for Supabase chain mocking
const createMockChain = (data: unknown, error: unknown = null) => {
  const result = { data, error };
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve) => Promise.resolve(result).then(resolve)),
    catch: vi.fn((reject) => Promise.resolve(result).catch(reject)),
  };
  return chain;
};

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    get: vi.fn(),
  },
  StorageKeys: {
    LOCAL_SESSION: 'solve-climb-local-session',
  },
}));

vi.mock('../../utils/safeJsonParse', () => ({
  isLocalSession: vi.fn(),
}));

describe('useMyPageStats', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks
    vi.mocked(storage.get).mockReturnValue(null);
    vi.mocked(isLocalSession).mockReturnValue(false);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);
    vi.mocked(supabase.from).mockImplementation(() => createMockChain(null) as any);
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);
  });

  it('should return default stats when no session', async () => {
    const { result } = renderHook(() => useMyPageStats());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({
      totalSolved: 0,
      maxLevel: 0,
      bestSubject: null,
      totalMasteryScore: 0,
      currentTierLevel: null,
      cyclePromotionPending: false,
      pendingCycleScore: 0,
      loginStreak: 0,
    });
  });

  it('should fetch stats from RPC when available', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
      error: null,
    } as any);

    const mockProfileData = {
      total_mastery_score: 1500,
      current_tier_level: 3,
      cycle_promotion_pending: true,
      pending_cycle_score: 50,
      login_streak: 5,
    };

    const mockRpcStats = [
      {
        total_solved: 50,
        max_level: 10,
        best_subject: 'Math',
      },
    ];

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'profiles') return createMockChain(mockProfileData);
      return createMockChain(null);
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRpcStats,
      error: null,
    } as any);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({
      totalSolved: 50,
      maxLevel: 10,
      bestSubject: 'Math',
      totalMasteryScore: 1500,
      currentTierLevel: 3,
      cyclePromotionPending: true,
      pendingCycleScore: 50,
      loginStreak: 5,
    });
  });

  it('should fallback to direct query when RPC is not found (404/PGRST116)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
      error: null,
    } as any);

    const mockProfileData = {
      total_mastery_score: 2000,
      current_tier_level: 4,
      cycle_promotion_pending: false,
      pending_cycle_score: 0,
      login_streak: 10,
    };

    const mockRecords = [
      { subject_id: 'Math', level: 5, best_score: 1000 },
      { subject_id: 'Science', level: 3, best_score: 500 },
      { subject_id: 'Math', level: 6, best_score: 500 }, // Total Math score: 1500
    ];

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'profiles') return createMockChain(mockProfileData);
      if (table === 'user_level_records') return createMockChain(mockRecords);
      return createMockChain(null);
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Function not found' } as PostgrestError,
    } as any);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({
      totalSolved: 3,
      maxLevel: 6,
      bestSubject: 'Math',
      totalMasteryScore: 2000, // Profile score (2000) > Records sum (1500)
      currentTierLevel: 4,
      cyclePromotionPending: false,
      pendingCycleScore: 0,
      loginStreak: 10,
    });
  });

  it('should handle local session correctly', async () => {
    const mockLocalSession = { userId: 'local-user', isAdmin: true };
    vi.mocked(storage.get).mockReturnValue(mockLocalSession);
    vi.mocked(isLocalSession).mockReturnValue(true);

    const mockProfileData = {
      total_mastery_score: 500,
      current_tier_level: 1,
      cycle_promotion_pending: false,
      pending_cycle_score: 0,
      login_streak: 1,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'PGRST116' } } as any);
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'profiles') return createMockChain(mockProfileData);
      if (table === 'user_level_records') return createMockChain([]);
      return createMockChain(null);
    });

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.session?.user.id).toBe('local-user');
    expect(result.current.stats?.totalMasteryScore).toBe(500);
  });

  it('should handle RPC errors and still perform fallback', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST500', message: 'Internal Server Error' } as PostgrestError,
    } as any);

    const mockRecords = [{ subject_id: 'Logic', level: 1, best_score: 100 }];

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'profiles') return createMockChain({ total_mastery_score: 0 });
      if (table === 'user_level_records') return createMockChain(mockRecords);
      return createMockChain(null);
    });

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.bestSubject).toBe('Logic');
  });

  it('should handle refetch manually', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(supabase.from).mockImplementation(() => createMockChain([]));

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(supabase.rpc).toHaveBeenCalledTimes(2); // Initial + refetch
  });
});
