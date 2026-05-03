import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHistoryData } from '../useHistoryData';
import { supabase } from '../../utils/supabaseClient';
import { storageService, STORAGE_KEYS } from '../../services';
import { ANONYMOUS_USER_TITLE } from '../../constants/history';
import type { Session, PostgrestError } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    get: vi.fn(),
  },
  STORAGE_KEYS: {
    LOCAL_SESSION: 'local_session',
  },
}));

// Mock date utilities to fix "now" for streak calculation
const MOCK_DATE = new Date('2024-01-10T12:00:00Z');

// Mock safeSupabaseQuery to passthrough
vi.mock('../../utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn((promise) => promise),
}));

describe('useHistoryData', () => {
  const mockFrom = vi.fn();
  const RealDate = Date;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockImplementation(mockFrom);

    // Mock global Date
    global.Date = class extends RealDate {
      constructor(date?: string | number | Date) {
        super(date || MOCK_DATE);
      }
    } as unknown as typeof Date;
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it('should return empty stats if no session exists', async () => {
    // Mock no local session
    vi.mocked(storageService.get).mockReturnValue(null);
    // Mock no supabase session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useHistoryData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats?.userTitle).toBe(ANONYMOUS_USER_TITLE);
    expect(result.current.stats?.totalAltitude).toBe(0);
  });

  it('should fetch and calculate stats for logged in user', async () => {
    // Mock logged in session (Supabase)
    const mockUserId = 'user_123';
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: { user: { id: mockUserId } } as unknown as Session,
      },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    // Mock DB responses based on table name
    mockFrom.mockImplementation((table: string) => {
      if (table === 'theme_mapping') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ code: 1, theme_id: 'math_basic', name: 'Math Basic' }],
            error: null,
          }),
        };
      }
      if (table === 'user_level_records') {
        const mockRecords = [
          {
            theme_code: 1,
            level: 5,
            mode_code: 1, // timeattack
            best_score: 50, // 50 points
            updated_at: new Date(MOCK_DATE.getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          },
        ];
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        };
      }
      if (table === 'game_sessions') {
        const mockSessions = [
          {
            category: 'math',
            subject: 'basic',
            level: 5,
            game_mode: 'timeattack',
            score: 50,
            created_at: new Date(MOCK_DATE.getTime() - 1000 * 60 * 60).toISOString(),
          },
        ];
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: { total_mastery_score: 100 }, error: null }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
          then: (resolve: (val: unknown) => void) => resolve({ data: [], error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const stats = result.current.stats;
    expect(stats).toBeTruthy();
    expect(stats?.totalAltitude).toBe(100);
    expect(stats?.streakCount).toBe(1);
    expect(stats?.categoryLevels).toHaveLength(1);
  });

  it('should handle streak calculation correctly', async () => {
    // Mock session
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as unknown as Session },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_level_records') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'game_sessions') {
        const yesterday = new Date(MOCK_DATE);
        yesterday.setDate(yesterday.getDate() - 1);
        const today = new Date(MOCK_DATE);
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                created_at: today.toISOString(),
                category: 'a',
                subject: 'b',
                level: 1,
                game_mode: 'c',
                score: 10,
              },
              {
                created_at: yesterday.toISOString(),
                category: 'a',
                subject: 'b',
                level: 1,
                game_mode: 'c',
                score: 10,
              },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
          then: (resolve: (val: unknown) => void) => resolve({ data: [], error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.streakCount).toBe(2);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as unknown as Session },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_level_records') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Records fail' } }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
          then: (resolve: (val: unknown) => void) => resolve({ data: [], error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Records fail');
  });

  it('should fallback to local history if no session and local history exists', async () => {
    vi.mocked(storageService.get).mockImplementation((key) => {
      if (key === STORAGE_KEYS.LOCAL_HISTORY) {
        return [
          {
            score: 100,
            date: MOCK_DATE.toISOString(),
            category: 'math',
            world: 'world1',
            level: 5,
            mode: 'survival',
            correctCount: 8,
            total: 10,
          },
        ];
      }
      return null;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toBeTruthy();
    expect(result.current.stats?.totalAltitude).toBe(100);
    expect(result.current.stats?.averageAccuracy).toBe(80);
    expect(result.current.stats?.heatmapData[27].intensity).toBe(1); // 1 play today
  });

  it('should calculate multipliers correctly for calculus and arithmetic', async () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as unknown as Session },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_level_records') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                theme_code: 1,
                category_id: 'math',
                subject_id: 'calculus',
                level: 1,
                mode_code: 1,
                best_score: 90,
                updated_at: MOCK_DATE.toISOString(),
              },
              {
                theme_code: 2,
                category_id: 'math',
                subject_id: 'arithmetic',
                level: 2,
                mode_code: 1,
                best_score: 15,
                updated_at: MOCK_DATE.toISOString(),
              },
            ],
            error: null,
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              total_mastery_score: 50,
              login_streak: 10,
              last_login_at: MOCK_DATE.toISOString(),
            },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.totalAltitude).toBe(105); // 90 + 15 = 105 (max of sum or profile)
    expect(result.current.stats?.allActivities.length).toBeGreaterThan(0);
    // Should include daily reward
    expect(result.current.stats?.allActivities[0].type).toBe('reward');
  });

  it('should parse local session', async () => {
    vi.mocked(storageService.get).mockImplementation((key) => {
      if (key === STORAGE_KEYS.LOCAL_SESSION) {
        return JSON.stringify({ userId: 'local_123', isAdmin: true });
      }
      return null;
    });

    mockFrom.mockImplementation((_table) => {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('user_level_records'); // should have proceeded to fetch DB
  });

  it('should handle malformed local session string', async () => {
    vi.mocked(storageService.get).mockImplementation((key) => {
      if (key === STORAGE_KEYS.LOCAL_SESSION) return 'invalid-json';
      return null;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useHistoryData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('JSON parsing failed:'),
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it('should handle heat map intensity levels', async () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as unknown as Session },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_level_records') {
        const records = [];
        // Add 12 records for today to hit intensity 4 (>10)
        for (let i = 0; i < 12; i++) {
          records.push({
            theme_code: 1,
            category_id: 'math',
            subject_id: 'calculus',
            level: 1,
            mode_code: 1,
            best_score: 10,
            updated_at: MOCK_DATE.toISOString(),
          });
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: records, error: null }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const todayHeatmap = result.current.stats?.heatmapData.find(
      (h) => h.date === MOCK_DATE.toDateString()
    );
    expect(todayHeatmap?.intensity).toBe(4);
  });

  it('should calculate streak from activity map when profile streak is 0', async () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as unknown as Session },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_level_records') {
        const records = [];
        // 3 consecutive days including today
        for (let i = 0; i < 3; i++) {
          const date = new Date(MOCK_DATE);
          date.setDate(date.getDate() - i);
          records.push({
            theme_code: 1,
            category_id: 'math',
            subject_id: 'calculus',
            level: 1,
            mode_code: 1,
            best_score: 10,
            updated_at: date.toISOString(),
          });
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: records, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { login_streak: 0 }, error: null }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats?.streakCount).toBe(3);
  });

  it('should handle duplicate category/level records and pick the best score', async () => {
    vi.mocked(storageService.get).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as unknown as Session },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_level_records') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                theme_code: 1,
                category_id: 'math',
                subject_id: 'calculus',
                level: 1,
                mode_code: 1,
                best_score: 50,
                updated_at: MOCK_DATE.toISOString(),
              },
              {
                theme_code: 1,
                category_id: 'math',
                subject_id: 'calculus',
                level: 1,
                mode_code: 1,
                best_score: 100,
                updated_at: MOCK_DATE.toISOString(),
              },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      };
    });

    const { result } = renderHook(() => useHistoryData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const calculusLevel1 = result.current.stats?.categoryLevels.find(
      (cl) => cl.themeId === 'math_calculus' && cl.level === 1
    );
    expect(result.current.stats?.categoryLevels).toHaveLength(1);
    expect(calculusLevel1).toBeTruthy();
  });
});
