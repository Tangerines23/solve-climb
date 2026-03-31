import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLevelProgressStore } from '../useLevelProgressStore';
import { supabase } from '../../utils/supabaseClient';
import { useToastStore } from '../useToastStore';
import { useDebugStore } from '../useDebugStore';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
  },
}));

vi.mock('../useToastStore', () => ({
  useToastStore: {
    getState: vi.fn(() => ({
      showToast: vi.fn(),
    })),
  },
}));

vi.mock('../useDebugStore', () => {
  const mockState = { bypassLevelLock: false };
  const mockStore = Object.assign(vi.fn(() => mockState), {
    getState: vi.fn(() => mockState),
    setState: vi.fn(),
    subscribe: vi.fn(),
  });
  return { useDebugStore: mockStore };
});

const mockShowToast = vi.fn();
(useToastStore.getState as any).mockReturnValue({ showToast: mockShowToast });

const createMockRpcBuilder = (data: any, error: any = null) => {
  const promise = Promise.resolve({ data, error });
  return Object.assign(promise, {
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  }) as any;
};

describe('useLevelProgressStore', () => {
  const world = 'math';
  const category = 'arithmetic_addition';

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default mock setup for successful calls
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null } as any);
    vi.mocked(supabase.rpc).mockImplementation(() => createMockRpcBuilder({ success: true }));

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb) => cb({ data: [], error: null })),
    } as any);

    // Reset store state
    const { result } = renderHook(() => useLevelProgressStore());
    await act(async () => {
      await result.current.resetProgress();
    });
    vi.clearAllMocks(); // Clear mocks again after reset
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Functionality', () => {
    it('should initialize with empty progress', () => {
      const { result } = renderHook(() => useLevelProgressStore());
      expect(result.current.progress).toEqual({});
    });

    it('should handle bypassLevelLock debug setting', () => {
      vi.mocked(useDebugStore.getState).mockReturnValue({ bypassLevelLock: true } as any);
      const { result } = renderHook(() => useLevelProgressStore());
      
      expect(result.current.isLevelCleared(world, category, 1)).toBe(true);
      expect(result.current.getNextLevel(world, category)).toBe(999);
    });

    it('should handle tier support (Hard Mode)', async () => {
      const { result } = renderHook(() => useLevelProgressStore());
      
      await act(async () => {
        await result.current.clearLevel(world, category, 1, 'time-attack', 100, 0, undefined, 'hard');
      });

      expect(result.current.isLevelCleared(world, category, 1, 'hard')).toBe(true);
      expect(result.current.isLevelCleared(world, category, 1, 'normal')).toBe(false);
      expect(result.current.getNextLevel(world, category, 'hard')).toBe(2);
    });
  });

  describe('clearLevel and Persistence', () => {
    it('should rollback on RPC failure in clearLevel', async () => {
      const { result } = renderHook(() => useLevelProgressStore());
      const rollbackWorld = 'math_rollback';
      
      // Specifically target this world for failure
      vi.mocked(supabase.rpc).mockImplementationOnce(() => 
        createMockRpcBuilder(null, { message: 'RPC Failure' })
      );

      await act(async () => {
        await result.current.clearLevel(rollbackWorld, category, 5, 'time-attack', 500);
      });

      // Should have rolled back (isLevelCleared check)
      // Note: we use our deep-clone fix to ensure previousProgress was unpolluted
      expect(result.current.isLevelCleared(rollbackWorld, category, 5)).toBe(false);
    });

    it('should handle tier support (Hard Mode) isolated from Normal', async () => {
      const { result } = renderHook(() => useLevelProgressStore());
      const tierWorld = 'math_tier';
      
      await act(async () => {
        // Clear level 1 in HARD mode
        await result.current.clearLevel(tierWorld, category, 1, 'time-attack', 100, 0, undefined, 'hard');
      });

      expect(result.current.isLevelCleared(tierWorld, category, 1, 'hard')).toBe(true);
      // NORMAL mode should still be locked
      expect(result.current.isLevelCleared(tierWorld, category, 1, 'normal')).toBe(false);
    });
  });

  describe('getBestRecords', () => {
    it('should calculate global best records across levels', async () => {
      const { result } = renderHook(() => useLevelProgressStore());
      const bestWorld = 'math_best';
      
      await act(async () => {
        await result.current.clearLevel(bestWorld, category, 1, 'time-attack', 100);
        await result.current.clearLevel(bestWorld, category, 2, 'time-attack', 200);
        await result.current.clearLevel(bestWorld, category, 1, 'survival', 500);
        await result.current.updateBestScore(bestWorld, category, 3, 'infinite', 1000);
      });

      const best = result.current.getBestRecords(bestWorld, category);
      expect(best['time-attack']).toBe(200);
      expect(best.survival).toBe(500);
      expect((best as any).infinite).toBe(1000);
    });
  });

  describe('syncProgress and Reconciliation', () => {
    it('should reconcile local and server scores', async () => {
      const { result } = renderHook(() => useLevelProgressStore());

      // 1. Set local high score
      act(() => {
        result.current.clearLevel(world, 'arithmetic_addition', 1, 'time-attack', 300);
      });

      // 2. Mock server response with low score for L1 and high score for L2
      const mockRecords = [
        {
          world_id: world,
          category_id: 'arithmetic',
          subject_id: 'addition',
          level: 1,
          mode_code: 1,
          best_score: 100, // Lower than local
          updated_at: '2024-01-01',
        },
        {
          world_id: world,
          category_id: 'arithmetic',
          subject_id: 'addition',
          level: 2,
          mode_code: 1,
          best_score: 500, // New from server
          updated_at: '2024-01-02',
        }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: mockRecords, error: null })),
      } as any);

      await act(async () => {
        await result.current.syncProgress();
      });

      const progress = result.current.getLevelProgress(world, 'arithmetic_addition');
      expect(progress.find(p => p.level === 1)?.bestScore['time-attack']).toBe(300); // Local won
      expect(progress.find(p => p.level === 2)?.bestScore['time-attack']).toBe(500); // Server added
    });
  });

  describe('Rankings and Realtime', () => {
    it('should fetch Hall of Fame (all-time) rankings', async () => {
      const { result } = renderHook(() => useLevelProgressStore());
      const mockHof = [{ user_id: 'legend', nickname: 'The King', score: 9999, rank: 1 }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: mockHof, error: null })),
      } as any);

      await act(async () => {
        await result.current.fetchRanking(null, null, 'all-time', 'total');
      });

      expect(result.current.rankings['all-time-total']).toEqual(mockHof);
    });

    it('should handle realtime subscription lifecycle', () => {
      const mockUnsubscribe = vi.fn();
      const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe });
      const mockOn = vi.fn().mockReturnThis();
      
      vi.mocked(supabase.channel).mockReturnValue({
        on: mockOn,
        subscribe: mockSubscribe,
      } as any);

      const { result } = renderHook(() => useLevelProgressStore());

      act(() => {
        result.current.subscribeToRankingUpdates();
      });

      expect(supabase.channel).toHaveBeenCalledWith('ranking-updates');
      expect(mockOn).toHaveBeenCalledWith('postgres_changes', expect.anything(), expect.anything());

      act(() => {
        result.current.unsubscribeFromRankingUpdates();
      });

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
