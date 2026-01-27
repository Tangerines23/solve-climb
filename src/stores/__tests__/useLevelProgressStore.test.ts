import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLevelProgressStore } from '../useLevelProgressStore';
import type { GameMode } from '../../types/quiz';
import { supabase } from '../../utils/supabaseClient';
import type { UserResponse, SupabaseClient } from '@supabase/supabase-js';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => {
  const mockSupabaseBuilder = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
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

const createMockQueryBuilder = (returnValue: any = { data: null, error: null }) => {
  const builder: any = {};
  const mockReturn = Promise.resolve(returnValue);

  builder.select = vi.fn(() => builder);
  builder.from = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.single = vi.fn(() => mockReturn);
  builder.maybeSingle = vi.fn(() => mockReturn);
  builder.upsert = vi.fn(() => mockReturn);
  builder.insert = vi.fn(() => mockReturn);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);

  builder.then = (
    onfulfilled?: ((value: any) => any) | null,
    onrejected?: ((reason: any) => any) | null
  ) => {
    return mockReturn.then(onfulfilled, onrejected);
  };

  return builder as unknown as ReturnType<SupabaseClient['from']>;
};

describe('useLevelProgressStore', () => {
  const world = 'math';
  const category = 'arithmetic_addition'; // Matches category_id + _ + subject_id logic

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.from).mockReturnValue(
      createMockQueryBuilder({
        data: null,
        error: null,
      })
    );
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as unknown as UserResponse);

    // Reset store state
    const { result } = renderHook(() => useLevelProgressStore());
    act(() => {
      result.current.resetProgress();
    });
  });

  it('should initialize with empty progress', () => {
    const { result } = renderHook(() => useLevelProgressStore());
    expect(result.current.progress).toEqual({});
  });

  it('should get level progress for existing category', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    act(() => {
      result.current.clearLevel(world, category, 1, 'time-attack', 100);
    });

    const progress = result.current.getLevelProgress(world, category);
    expect(progress.length).toBe(1);
    expect(progress[0].level).toBe(1);
    expect(progress[0].cleared).toBe(true);
    expect(progress[0].bestScore['time-attack']).toBe(100);
  });

  it('should get next level correctly', () => {
    const { result } = renderHook(() => useLevelProgressStore());
    expect(result.current.getNextLevel(world, category)).toBe(1);

    act(() => {
      result.current.clearLevel(world, category, 1, 'time-attack', 100);
    });
    expect(result.current.getNextLevel(world, category)).toBe(2);
  });

  it('should sync progress from Supabase correctly', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const mockRecords = [
      {
        world_id: 'math',
        category_id: 'arithmetic',
        subject_id: 'addition',
        level: 1,
        mode_code: 1,
        best_score: 150,
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue(
      createMockQueryBuilder({ data: mockRecords, error: null })
    );

    await act(async () => {
      await result.current.syncProgress();
    });

    await waitFor(() => {
      const progress = result.current.getLevelProgress('math', 'arithmetic_addition');
      expect(progress[0].bestScore['time-attack']).toBe(150);
      expect(progress[0].cleared).toBe(true);
    });
  });

  it('should handle syncProgress when server score is higher', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    // Local score
    act(() => {
      result.current.clearLevel('math', 'arithmetic_addition', 1, 'time-attack', 100);
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockRecords = [
      {
        world_id: 'math',
        category_id: 'arithmetic',
        subject_id: 'addition',
        level: 1,
        mode_code: 1,
        best_score: 200, // Higher than local
        updated_at: '2024-01-01',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue(
      createMockQueryBuilder({ data: mockRecords, error: null })
    );

    await act(async () => {
      await result.current.syncProgress();
    });

    await waitFor(() => {
      const progress = result.current.getLevelProgress('math', 'arithmetic_addition');
      expect(progress[0].bestScore['time-attack']).toBe(200);
    });
  });

  it('should handle syncProgress when local score is higher', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    // Local score
    act(() => {
      result.current.clearLevel('math', 'arithmetic_addition', 1, 'time-attack', 300);
    });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockRecords = [
      {
        world_id: 'math',
        category_id: 'arithmetic',
        subject_id: 'addition',
        level: 1,
        mode_code: 1,
        best_score: 100, // Lower than local
        updated_at: '2024-01-01',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue(
      createMockQueryBuilder({ data: mockRecords, error: null })
    );

    await act(async () => {
      await result.current.syncProgress();
    });

    await waitFor(() => {
      const progress = result.current.getLevelProgress('math', 'arithmetic_addition');
      expect(progress[0].bestScore['time-attack']).toBe(300);
    });
  });

  it('should handle clearLevel and update best score', () => {
    const { result } = renderHook(() => useLevelProgressStore());

    act(() => {
      result.current.clearLevel(world, category, 1, 'time-attack', 100);
    });

    expect(result.current.isLevelCleared(world, category, 1)).toBe(true);
    const progress = result.current.getLevelProgress(world, category);
    expect(progress[0].bestScore['time-attack']).toBe(100);
  });

  it('should reset progress', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    act(() => {
      result.current.clearLevel(world, category, 1, 'time-attack', 100);
    });

    expect(result.current.isLevelCleared(world, category, 1)).toBe(true);

    await act(async () => {
      await result.current.resetProgress();
    });

    expect(result.current.progress).toEqual({});
  });

  it('should fetch ranking successfully', async () => {
    const { result } = renderHook(() => useLevelProgressStore());

    const mockRanking = [{ user_id: 'user-1', nickname: 'User 1', score: 1000, rank: 1 }];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRanking,
      error: null,
    } as any);

    await act(async () => {
      await result.current.fetchRanking(world, category, 'weekly', 'total', 10);
    });

    await waitFor(() => {
      const key = `${world}-${category}-weekly-total`;
      expect(result.current.rankings[key]).toEqual(mockRanking);
    });
  });
});
