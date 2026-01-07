import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLevelProgressStore } from '../useLevelProgressStore';
import type { GameMode } from '../../types/quiz';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('useLevelProgressStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});

