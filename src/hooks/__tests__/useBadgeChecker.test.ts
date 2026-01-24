import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBadgeChecker } from '../useBadgeChecker';
import { supabase } from '../../utils/supabaseClient';
import { HistoryStats } from '../useHistoryData';

// Mock Badge Definitions
vi.mock('../../constants/badges', () => ({
  BADGE_DEFINITIONS: [
    {
      id: 'test_altitude',
      name: 'Test Altitude',
      description: 'Reach 100m',
      goalAltitude: 100,
    },
    {
      id: 'test_streak',
      name: 'Test Streak',
      description: 'Reach 5 streak',
      goalStreak: 5,
    },
    {
      id: 'test_accuracy',
      name: 'Test Accuracy',
      description: '90% accuracy in 5 games',
      minGames: 5,
      minAccuracy: 90,
    },
    {
      id: 'test_level',
      name: 'Test Level',
      description: 'Reach level 5 in math',
      goalThemePart: 'math',
      goalLevel: 5,
    },
  ],
}));

// Mock Supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      eq: vi.fn(),
      insert: vi.fn(),
    })),
  },
}));

describe('useBadgeChecker', () => {
  const mockUserId = 'user_123';
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase chain mocks
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      mockFrom(table);
      return {
        select: (_cols: string) => {
          // Return separate chain for select vs insert if needed,
          // but here we just reuse chain for simplicity or customize based on table
          return {
            eq: (_col: string, _val: unknown) => Promise.resolve({ data: [], error: null }), // Default empty badges
          };
        },

        insert: mockInsert.mockResolvedValue({ error: null }),
      } as unknown as any;
    });

    // We need more control over select chain specifically
    // Re-setup more precise mock
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: mockInsert.mockResolvedValue({ error: null }), // default success
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue(chain as any);
    mockSelect.mockImplementation(chain.eq); // capture the final promise returner
  });

  const defaultStats: HistoryStats = {
    weeklyTotal: 0,
    weeklyTotalLastWeek: 0,
    graphPercentage: 0,
    wrongAnswers: 0,
    dailyCounts: [],
    weekDays: [],
    monthlyTotal: 0,
    monthlyTotalLastMonth: 0,
    monthlyDailyCounts: [],
    monthlyDays: [],
    categoryLevels: [],
    recentRecords: [],
    totalAltitude: 0,
    userTitle: 'Beginner',
    totalCorrect: 0,
    averageAccuracy: 0,
    maxCombo: 0,
    nextTierGoal: 0,
    nextTierName: '',
    streakCount: 0,
    heatmapData: [],
    smartComment: '',
    allActivities: [],
  };

  const baseStats: HistoryStats = {
    ...defaultStats,
  };

  it('should not award badges if criteria not met', async () => {
    const { result } = renderHook(() => useBadgeChecker());

    await result.current.checkAndAwardBadges(mockUserId, baseStats);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should award altitude badge when condition met', async () => {
    const { result } = renderHook(() => useBadgeChecker());

    const stats = { ...baseStats, totalAltitude: 150 }; // Goal is 100

    const newBadges = await result.current.checkAndAwardBadges(mockUserId, stats);

    expect(newBadges).toContain('test_altitude');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ badge_id: 'test_altitude', user_id: mockUserId }),
      ])
    );
  });

  it('should award streak badge when condition met', async () => {
    const { result } = renderHook(() => useBadgeChecker());

    const stats = { ...baseStats, streakCount: 5 }; // Goal is 5

    const newBadges = await result.current.checkAndAwardBadges(mockUserId, stats);

    expect(newBadges).toContain('test_streak');
  });

  it('should award accuracy badge when condition met', async () => {
    const { result } = renderHook(() => useBadgeChecker());

    const stats = { ...baseStats, weeklyTotal: 6, averageAccuracy: 95 }; // Goal: 5 games, 90% acc

    const newBadges = await result.current.checkAndAwardBadges(mockUserId, stats);

    expect(newBadges).toContain('test_accuracy');
  });

  it('should award level badge when condition met', async () => {
    const { result } = renderHook(() => useBadgeChecker());

    const stats: HistoryStats = {
      ...baseStats,
      categoryLevels: [
        {
          themeCode: 1,
          themeId: 'math_basic',
          categoryName: '?�학', // Added missing property
          level: 5,
          levelName: 'lv5',
          progress: 0,
        } as HistoryStats['categoryLevels'][0],
      ],
    }; // Goal: math, level 5

    const newBadges = await result.current.checkAndAwardBadges(mockUserId, stats);

    expect(newBadges).toContain('test_level');
  });

  it('should NOT award already owned badges', async () => {
    // Mock existing badges
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ badge_id: 'test_altitude' }],
        error: null,
      }),
      insert: mockInsert,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue(chain as any);

    const { result } = renderHook(() => useBadgeChecker());
    const stats = { ...baseStats, totalAltitude: 200 }; // Qualified for altitude

    const newBadges = await result.current.checkAndAwardBadges(mockUserId, stats);

    expect(newBadges).not.toContain('test_altitude');
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
