import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHistoryData } from '../useHistoryData';
import { supabase } from '../../utils/supabaseClient';
import { storage } from '../../utils/storage';
import { ANONYMOUS_USER_TITLE } from '../../constants/history';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    getString: vi.fn(),
  },
  StorageKeys: {
    LOCAL_SESSION: 'local_session',
  },
}));

// Mock date utilities to fix "now" for streak calculation
const MOCK_DATE = new Date('2024-01-10T12:00:00Z');

// Mock debugSupabaseQuery to passthrough
vi.mock('../../utils/debugFetch', () => ({
  debugSupabaseQuery: vi.fn((promise) => promise),
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
    } as any;
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it('should return empty stats if no session exists', async () => {
    // Mock no local session
    vi.mocked(storage.getString).mockReturnValue(null);
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
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: { user: { id: mockUserId } } as any,
      },
      error: null,
    });

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
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as any },
      error: null,
    });

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
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'temp' } } as any },
      error: null,
    });

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
});
