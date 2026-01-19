import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLevelProgressStore } from '../useLevelProgressStore';
import type { GameMode } from '../../types/quiz';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => {
  const mockSupabaseBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: null, error: null })),
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(() => mockSupabaseBuilder),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

describe('useLevelProgressStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset supabase mock to a robust builder
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: null, error: null })),
    } as any;

    vi.mocked(supabase.from).mockReturnValue(mockBuilder);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });

    // Reset store state
    const { result } = renderHook(() => useLevelProgressStore());
    act(() => {
      result.current.resetProgress();
    });
  });

  it('should initialize with empty progress', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    expect(result.current.progress).toEqual({});
    expect(result.current.rankings).toEqual({});
  });

  it('should get empty level progress for non-existent category', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const progress = result.current.getLevelProgress('math', 'addition');

    expect(progress).toEqual([]);
  });

  it('should get level progress for existing category and subTopic', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    const progress = result.current.getLevelProgress('math', 'addition');

    expect(progress.length).toBe(1);
    expect(progress[0].level).toBe(1);
    expect(progress[0].cleared).toBe(true);
    expect(progress[0].bestScore['time-attack']).toBe(100);
  });

  it('should check if level is cleared', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(false);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(true);
    expect(result.current.isLevelCleared('math', 'addition', 2)).toBe(false);
  });

  it('should get next level correctly', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    // No cleared levels, should return 1
    expect(result.current.getNextLevel('math', 'addition')).toBe(1);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    // Level 1 cleared, should return 2
    expect(result.current.getNextLevel('math', 'addition')).toBe(2);

    act(() => {
      result.current.clearLevel('math', 'addition', 2, 'time-attack', 150);
    });

    // Level 2 cleared, should return 3
    expect(result.current.getNextLevel('math', 'addition')).toBe(3);
  });

  it('should clear level and update best score', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(true);
    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(100);
  });

  it('should update best score when new score is higher', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    act(() => {
      result.current.updateBestScore('math', 'addition', 1, 'time-attack', 150);
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(150);
  });

  it('should not update best score when new score is lower', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 150);
    });

    act(() => {
      result.current.updateBestScore('math', 'addition', 1, 'time-attack', 100);
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(150);
  });

  it('should get best records for category and subTopic', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
      result.current.clearLevel('math', 'addition', 2, 'survival', 200);
    });

    const bestRecords = result.current.getBestRecords('math', 'addition');

    expect(bestRecords['time-attack']).toBe(100);
    expect(bestRecords['survival']).toBe(200);
  });

  it('should handle different game modes', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
      result.current.clearLevel('math', 'addition', 1, 'survival', 150);
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(100);
    expect(progress[0].bestScore['survival']).toBe(150);
  });

  it('should reset progress', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(true);

    await act(async () => {
      await result.current.resetProgress();
    });

    await waitFor(() => {
      expect(result.current.progress).toEqual({});
    });
  });

  it('should sync progress from Supabase', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const mockRecords = [
      {
        category: 'math',
        subject: 'addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
        cleared: true,
        cleared_at: '2024-01-01T00:00:00Z',
      },
      {
        category: 'math',
        subject: 'addition',
        level: 2,
        mode: 'survival',
        score: 200,
        cleared: true,
        cleared_at: '2024-01-02T00:00:00Z',
      },
    ];

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    await waitFor(() => {
      expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(true);
      expect(result.current.isLevelCleared('math', 'addition', 2)).toBe(true);
      const progress = result.current.getLevelProgress('math', 'addition');
      expect(progress[0].bestScore['time-attack']).toBe(100);
      expect(progress[1].bestScore['survival']).toBe(200);
    });
  });

  it('should handle syncProgress error gracefully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' },
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle syncProgress when user is not logged in', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    // Progress should remain unchanged
    expect(result.current.progress).toEqual({});
  });

  it('should fetch ranking successfully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const mockRanking = [
      { user_id: 'user-1', nickname: 'User 1', score: 1000, rank: 1 },
      { user_id: 'user-2', nickname: 'User 2', score: 900, rank: 2 },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRanking,
      error: null,
    } as any);

    await act(async () => {
      await result.current.fetchRanking('math', 'addition', 'weekly', 'total', 10);
    });

    await waitFor(() => {
      const rankings = result.current.rankings['math-addition-weekly-total'];
      expect(rankings).toEqual(mockRanking);
    });
  });

  it('should handle fetchRanking error gracefully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    } as any);

    await act(async () => {
      await result.current.fetchRanking('math', 'weekly', 'total');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should get best records across multiple levels', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
      result.current.clearLevel('math', 'addition', 2, 'time-attack', 200);
      result.current.clearLevel('math', 'addition', 3, 'time-attack', 150);
    });

    const bestRecords = result.current.getBestRecords('math', 'addition');

    expect(bestRecords['time-attack']).toBe(200); // Highest score across all levels
  });

  it('should handle clearLevel error gracefully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      }),
    } as any);

    await act(async () => {
      await result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    // Local state should still be updated (optimistic update)
    expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle updateBestScore error gracefully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      }),
    } as any);

    await act(async () => {
      await result.current.updateBestScore('math', 'addition', 1, 'time-attack', 100);
    });

    // Local state should still be updated (optimistic update)
    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(100);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle clearLevel when user is not logged in', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    await act(async () => {
      await result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    // Local state should still be updated
    expect(result.current.isLevelCleared('math', 'addition', 1)).toBe(true);
  });

  it('should handle updateBestScore when user is not logged in', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    await act(async () => {
      await result.current.updateBestScore('math', 'addition', 1, 'time-attack', 100);
    });

    // Local state should still be updated
    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(100);
  });

  it('should handle resetProgress error gracefully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' },
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.resetProgress();
    });

    // Local state should still be reset
    expect(result.current.progress).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle getNextLevel with non-sequential cleared levels', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
      result.current.clearLevel('math', 'addition', 3, 'time-attack', 150);
    });

    // Should return 4 (highest cleared level + 1)
    expect(result.current.getNextLevel('math', 'addition')).toBe(4);
  });

  it('should return null best records when no records exist', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const bestRecords = result.current.getBestRecords('math', 'addition');

    expect(bestRecords['time-attack']).toBeNull();
    expect(bestRecords['survival']).toBeNull();
  });

  it('should get best records with only time-attack scores', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
      result.current.clearLevel('math', 'addition', 2, 'time-attack', 200);
    });

    const bestRecords = result.current.getBestRecords('math', 'addition');

    expect(bestRecords['time-attack']).toBe(200);
    expect(bestRecords['survival']).toBeNull();
  });

  it('should get best records with only survival scores', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'survival', 150);
      result.current.clearLevel('math', 'addition', 2, 'survival', 250);
    });

    const bestRecords = result.current.getBestRecords('math', 'addition');

    expect(bestRecords['time-attack']).toBeNull();
    expect(bestRecords['survival']).toBe(250);
  });

  it('should not update best score when new score is lower', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    await act(async () => {
      await result.current.updateBestScore('math', 'addition', 1, 'time-attack', 200);
    });

    const progress1 = result.current.getLevelProgress('math', 'addition');
    expect(progress1[0].bestScore['time-attack']).toBe(200);

    await act(async () => {
      await result.current.updateBestScore('math', 'addition', 1, 'time-attack', 100);
    });

    const progress2 = result.current.getLevelProgress('math', 'addition');
    expect(progress2[0].bestScore['time-attack']).toBe(200); // Should not update
  });

  it('should update best score when new score is higher', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    await act(async () => {
      await result.current.updateBestScore('math', 'addition', 1, 'time-attack', 100);
    });

    const progress1 = result.current.getLevelProgress('math', 'addition');
    expect(progress1[0].bestScore['time-attack']).toBe(100);

    await act(async () => {
      await result.current.updateBestScore('math', 'addition', 1, 'time-attack', 200);
    });

    const progress2 = result.current.getLevelProgress('math', 'addition');
    expect(progress2[0].bestScore['time-attack']).toBe(200); // Should update
  });

  it('should handle syncProgress when records is null', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    // Progress should remain empty
    expect(result.current.progress).toEqual({});
  });

  it('should handle syncProgress when cleared is false', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockRecords = [
      {
        category: 'math',
        subject: 'addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
        cleared: false,
        cleared_at: null,
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].cleared).toBe(false);
    expect(progress[0].bestScore['time-attack']).toBe(100);
  });

  it('should handle syncProgress when local score is higher', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    // First set local score
    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 200);
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockRecords = [
      {
        category: 'math',
        subject: 'addition',
        level: 1,
        mode: 'time-attack',
        score: 100, // Lower than local
        cleared: true,
        cleared_at: '2024-01-01',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(200); // Should keep local higher score
    expect(progress[0].cleared).toBe(true); // But cleared should be updated
  });

  it('should handle syncProgress when server score is higher', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    // First set local score
    act(() => {
      result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockRecords = [
      {
        category: 'math',
        subject: 'addition',
        level: 1,
        mode: 'time-attack',
        score: 200, // Higher than local
        cleared: true,
        cleared_at: '2024-01-01',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(200); // Should update to server score
  });

  it('should handle syncProgress when local bestScore is null', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockRecords = [
      {
        category: 'math',
        subject: 'addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
        cleared: true,
        cleared_at: '2024-01-01',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      }),
    } as any);

    await act(async () => {
      await result.current.syncProgress();
    });

    const progress = result.current.getLevelProgress('math', 'addition');
    expect(progress[0].bestScore['time-attack']).toBe(100); // Should set from server
  });

  it('should handle clearLevel when score is lower than existing best', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    await act(async () => {
      await result.current.clearLevel('math', 'addition', 1, 'time-attack', 200);
    });

    const progress1 = result.current.getLevelProgress('math', 'addition');
    expect(progress1[0].bestScore['time-attack']).toBe(200);

    await act(async () => {
      await result.current.clearLevel('math', 'addition', 1, 'time-attack', 100);
    });

    const progress2 = result.current.getLevelProgress('math', 'addition');
    expect(progress2[0].cleared).toBe(true); // Should still be cleared
    expect(progress2[0].bestScore['time-attack']).toBe(200); // Should keep higher score
  });

  it('should handle fetchRanking when data is null', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const initialRankings = { ...result.current.rankings };

    await act(async () => {
      await result.current.fetchRanking('math', 'weekly', 'total', 10);
    });

    // Rankings should not be updated (should remain the same)
    expect(result.current.rankings).toEqual(initialRankings);
  });

  it('should handle fetchRanking when error occurs', async () => {
    const { result } = renderHook(() => useLevelProgressStore());
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    } as any);

    await act(async () => {
      await result.current.fetchRanking('math', 'weekly', 'total', 10);
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle fetchRanking with custom limit', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const mockRanking = [
      { user_id: 'user1', nickname: 'User1', score: 100, rank: 1 },
      { user_id: 'user2', nickname: 'User2', score: 90, rank: 2 },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRanking,
      error: null,
    } as any);

    await act(async () => {
      await result.current.fetchRanking('math', 'addition', 'all-time', 'survival', 20);
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_ranking_v2', {
      p_category: 'math',
      p_period: 'all-time',
      p_type: 'survival',
      p_limit: 20,
    });

    expect(result.current.rankings['math-addition-all-time-survival']).toEqual(mockRanking);
  });
});
