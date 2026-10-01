import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRanking } from '../useRanking';
import { useRankingStore } from '@/stores/useRankingStore';
import { useAuthStore } from '@/stores/useAuthStore';

let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams],
}));

describe('useRanking hook', () => {
  const mockFetchRanking = vi.fn().mockResolvedValue(undefined);
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();

    // Reset store states
    act(() => {
      useRankingStore.setState({
        rankings: {
          'weekly-total': [
            { user_id: 'user-1', nickname: '플레이어1', score: 1200, rank: 1 },
            { user_id: 'user-2', nickname: '플레이어2', score: 900, rank: 2 },
          ],
          'weekly-time-attack': [{ user_id: 'user-3', nickname: '스피더', score: 500, rank: 1 }],
          'all-time-total': [
            {
              user_id: 'legend-1',
              nickname: '전설',
              score: 99999,
              rank: 1,
              week_start_date: '2026-08-01',
            },
          ],
        },
        rankingVersion: 0,
        fetchRanking: mockFetchRanking,
        subscribeToRankingUpdates: mockSubscribe,
        unsubscribeFromRankingUpdates: mockUnsubscribe,
      });

      useAuthStore.setState({
        user: { id: 'user-1', email: 'test@example.com' } as any,
      });
    });
  });

  const renderRankingHook = async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useRanking());
    });
    return hookResult;
  };

  it('initializes with default period weekly and type total', async () => {
    const { result } = await renderRankingHook();

    expect(result.current.activePeriod).toBe('weekly');
    expect(result.current.activeType).toBe('total');
    expect(result.current.currentRankings).toHaveLength(2);
    expect(result.current.currentRankings[0].nickname).toBe('플레이어1');
  });

  it('initializes activeType from searchParams if valid', async () => {
    mockSearchParams = new URLSearchParams('mode=time-attack');
    const { result } = await renderRankingHook();

    expect(result.current.activeType).toBe('time-attack');
    expect(result.current.currentRankings).toHaveLength(1);
    expect(result.current.currentRankings[0].nickname).toBe('스피더');
  });

  it('derives myRank accurately from current user id in auth store', async () => {
    const { result } = await renderRankingHook();

    expect(result.current.currentUserId).toBe('user-1');
    expect(result.current.myRank).not.toBeNull();
    expect(result.current.myRank?.nickname).toBe('플레이어1');
    expect(result.current.myRank?.rank).toBe(1);
  });

  it('returns null for myRank when user is not in the rankings list', async () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 'unknown-user', email: 'unknown@example.com' } as any,
      });
    });

    const { result } = await renderRankingHook();
    expect(result.current.myRank).toBeNull();
  });

  it('subscribes to realtime ranking updates on weekly, unsubscribes on all-time', async () => {
    const { result } = await renderRankingHook();

    expect(mockSubscribe).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.setActivePeriod('all-time');
    });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from realtime updates when unmounted', async () => {
    const { unmount } = await renderRankingHook();

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('fetches ranking when activeType or activePeriod changes', async () => {
    const { result } = await renderRankingHook();

    await act(async () => {
      result.current.setActiveType('survival');
    });

    expect(mockFetchRanking).toHaveBeenCalledWith(null, null, 'weekly', 'survival');
  });

  it('supports manual refresh', async () => {
    const { result } = await renderRankingHook();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetchRanking).toHaveBeenCalledWith(null, null, 'weekly', 'total');
  });
});
