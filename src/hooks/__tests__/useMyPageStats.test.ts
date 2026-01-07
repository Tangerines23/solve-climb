import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyPageStats } from '../useMyPageStats';
import { supabase } from '../../utils/supabaseClient';
import { storage } from '../../utils/storage';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    getString: vi.fn(),
  },
}));

vi.mock('../../utils/safeJsonParse', () => ({
  parseLocalSession: vi.fn(),
}));

describe('useMyPageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default stats when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalHeight: 0,
      totalSolved: 0,
      maxLevel: 0,
      bestSubject: null,
      totalMasteryScore: 0,
      currentTierLevel: null,
      cyclePromotionPending: false,
      pendingCycleScore: 0,
    });
  });

  it('should fetch stats from RPC when available', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              total_mastery_score: 1000,
              current_tier_level: 2,
              cycle_promotion_pending: false,
              pending_cycle_score: 0,
            },
            error: null,
          }),
        })),
      })),
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          total_height: 5000,
          total_solved: 100,
          max_level: 5,
          best_subject: 'math',
        },
      ],
      error: null,
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.totalHeight).toBe(5000);
    expect(result.current.stats?.totalSolved).toBe(100);
  });

  it('should fallback to direct query when RPC fails', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockGameRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [
          { score: 100, cleared: true, level: 1, subject: 'math' },
          { score: 200, cleared: true, level: 2, subject: 'math' },
        ],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'game_records') {
        return {
          select: mockGameRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.totalHeight).toBe(300);
    expect(result.current.stats?.totalSolved).toBe(2);
  });
});

