import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifySync } from '../debugSync';
import { supabase } from '../supabaseClient';
import { calculateTier } from '../../constants/tiers';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../constants/tiers', () => ({
  calculateTier: vi.fn(),
}));

describe('debugSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify sync successfully when all data is synced', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000, current_tier_level: 1 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ best_score: 1000 }],
              error: null,
            }),
          })),
        } as never;
      }
      if (table === 'user_badges') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ badge_id: 1 }],
              error: null,
            }),
          })),
        } as never;
      }
      if (table === 'badge_definitions') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
          }),
        } as never;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ item_id: 1, quantity: 5 }],
              error: null,
            }),
          })),
        } as never;
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
          }),
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });

    const result = await verifySync('test-user');

    expect(result.profile.synced).toBe(true);
    expect(result.tier.synced).toBe(true);
    expect(result.badges.synced).toBe(true);
    expect(result.inventory.synced).toBe(true);
  });

  it('should detect profile score mismatch', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 2000 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      if (table === 'game_results') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ mastery_score: 1000 }],
              error: null,
            }),
          })),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });

    const result = await verifySync('test-user');

    expect(result.profile.synced).toBe(false);
    expect(result.profile.issues.length).toBeGreaterThan(0);
  });

  it('should detect tier mismatch', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000, current_tier_level: 2 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });

    const result = await verifySync('test-user');

    expect(result.tier.synced).toBe(false);
    expect(result.tier.issues.length).toBeGreaterThan(0);
  });

  it('should detect undefined badge', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      if (table === 'user_badges') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ badge_id: 999 }],
              error: null,
            }),
          })),
        } as never;
      }
      if (table === 'badge_definitions') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
          }),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });

    const result = await verifySync('test-user');

    expect(result.badges.synced).toBe(false);
    expect(result.badges.issues.length).toBeGreaterThan(0);
  });

  it('should detect negative inventory quantity', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [{ item_id: 1, quantity: -5 }],
              error: null,
            }),
          })),
        } as never;
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
          }),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });

    const result = await verifySync('test-user');

    expect(result.inventory.synced).toBe(false);
    expect(result.inventory.issues.length).toBeGreaterThan(0);
  });

  it('should handle profile query error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Profile not found' },
              }),
            })),
          })),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    const result = await verifySync('test-user');

    expect(result.profile.synced).toBe(false);
    expect(result.profile.issues.length).toBeGreaterThan(0);
  });

  it('should handle game records query error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      if (table === 'game_results') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          })),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    const result = await verifySync('test-user');

    expect(result.profile.synced).toBe(false);
    expect(result.profile.issues.length).toBeGreaterThan(0);
  });

  it('should handle tier calculation error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000, current_tier_level: 1 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    vi.mocked(calculateTier).mockRejectedValue(new Error('Tier calculation failed'));

    const result = await verifySync('test-user');

    expect(result.tier.synced).toBe(false);
    expect(result.tier.issues.length).toBeGreaterThan(0);
  });

  it('should handle badge query error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { total_mastery_score: 1000 },
                error: null,
              }),
            })),
          })),
        } as never;
      }
      if (table === 'user_badges') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Badge query failed' },
            }),
          })),
        } as never;
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as never;
    });

    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });

    const result = await verifySync('test-user');

    expect(result.badges.synced).toBe(false);
    expect(result.badges.issues.length).toBeGreaterThan(0);
  });
});
