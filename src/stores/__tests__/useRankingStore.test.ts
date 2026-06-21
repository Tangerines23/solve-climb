import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRankingStore } from '../useRankingStore';
import { supabase } from '../../utils/supabaseClient';

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
  },
}));

vi.mock('../../utils/rpcValidator', () => ({
  validatedRpc: vi.fn().mockImplementation((p) => p),
  RankingListSchema: {},
}));

describe('useRankingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useRankingStore.setState({
        rankings: {},
        rankingVersion: 0,
        _rankingSubscription: null,
      });
    });
  });

  describe('Rankings and Realtime', () => {
    it('should fetch Hall of Fame (all-time) rankings', async () => {
      const { result } = renderHook(() => useRankingStore());
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

    it('should handle realtime subscription lifecycle and events', () => {
      let eventCallback: any;
      const mockUnsubscribe = vi.fn();
      const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe });
      const mockOn = vi.fn().mockImplementation((_type, _filter, callback) => {
        eventCallback = callback;
        return { subscribe: mockSubscribe };
      });

      vi.mocked(supabase.channel).mockReturnValue({
        on: mockOn,
        subscribe: mockSubscribe,
      } as any);

      const { result } = renderHook(() => useRankingStore());

      act(() => {
        result.current.subscribeToRankingUpdates();
      });

      expect(supabase.channel).toHaveBeenCalledWith('ranking-updates');

      // Simulate realtime update
      act(() => {
        eventCallback({ new: { id: 'test' } });
      });
      expect(result.current.rankingVersion).toBe(1);

      act(() => {
        result.current.unsubscribeFromRankingUpdates();
      });

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
