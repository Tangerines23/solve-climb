import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMyPageStats } from '../useMyPageStats';
import { supabase } from '../../utils/supabaseClient';
import { storage } from '../../utils/storage';
import { parseLocalSession } from '../../utils/safeJsonParse';

// Helper for Supabase chain mocking
const createMockChain = (data: any, error: any = null) => {
  const result = { data, error };
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve) => Promise.resolve(result).then(resolve)),
    catch: vi.fn((reject) => Promise.resolve(result).catch(reject)),
  };
  return chain;
};

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    getString: vi.fn(),
  },
  StorageKeys: {
    LOCAL_SESSION: 'solve-climb-local-session',
    DEVICE_ID: 'solve-climb-device-id',
    PROFILES: (deviceId: string) => `solve-climb-profiles-${deviceId}`,
    ACTIVE_PROFILE_ID: 'solve-climb-active-profile-id',
    ADMIN_MODE: 'solve-climb-admin-mode',
    PROGRESS: (profileId: string) => `solve-climb-progress-${profileId}`,
  },
}));

vi.mock('../../utils/safeJsonParse', () => ({
  parseLocalSession: vi.fn(),
}));

describe('useMyPageStats', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(parseLocalSession).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);
    vi.mocked(supabase.from).mockImplementation(() => createMockChain(null) as any);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);
  });

  it('should return default stats when no session', async () => {
    // defaults are already set in beforeEach
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useMyPageStats());
      result = rendered.result;
    });

    // Hook이 초기화되는지 확인
    expect(result.current).toBeTruthy();
    expect(typeof result.current.refetch).toBe('function');
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should fetch stats from RPC when available', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfileData = {
      total_mastery_score: 1000,
      current_tier_level: 2,
      cycle_promotion_pending: false,
      pending_cycle_score: 0,
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return createMockChain(mockProfileData) as any;
      return createMockChain([]) as any;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          total_height: 5000,
          total_solved: 100,
          max_level: 5,
          best_subject: 'math',
        },
      ],
      error: null,
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });

  it('should fallback to direct query when RPC fails', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return createMockChain({
          total_mastery_score: 1000,
          current_tier_level: 2,
          cycle_promotion_pending: false,
          pending_cycle_score: 0,
        }) as any;
      }
      if (table === 'user_level_records') {
        return createMockChain([
          { best_score: 100, level: 1, theme_code: 1 },
          { best_score: 200, level: 2, theme_code: 1 },
        ]) as any;
      }
      return createMockChain([]) as any;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });

  it('should handle local session', async () => {
    const mockLocalSession = {
      userId: 'user_local_123',
      isAdmin: false,
    };
    vi.mocked(storage.getString).mockReturnValue(JSON.stringify(mockLocalSession));
    vi.mocked(parseLocalSession).mockReturnValue(mockLocalSession);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
    expect(result.current.stats?.totalSolved).toBe(0);
    expect(result.current.session).toBeTruthy();
  });

  it('should handle RPC error (non-404)', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [
        { code: 1, theme_id: 'theme-1', name: 'Math' },
      ],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [
          { theme_code: 1, level: 1, best_score: 100 },
        ],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST500', message: 'Server error' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });

  it('should handle profile query error', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' },
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });

  it('should handle empty levelRecords', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
    expect(result.current.stats?.totalSolved).toBe(0);
    expect(result.current.stats?.maxLevel).toBe(0);
    expect(result.current.stats?.bestSubject).toBeNull();
  });

  it('should calculate bestSubject from theme_mapping', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [
        { code: 1, theme_id: 'theme-1', name: 'Math' },
        { code: 2, theme_id: 'theme-2', name: 'Language' },
      ],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [
          { theme_code: 1, level: 1, best_score: 200 },
          { theme_code: 2, level: 1, best_score: 100 },
        ],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
    expect(result.current.stats?.bestSubject).toBe('theme-1');
  });

  it('should handle theme_mapping query error', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Query failed' },
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [
          { theme_code: 1, level: 1, best_score: 100 },
        ],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });

  it('should handle user_level_records query error', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.error).toBeTruthy();
    expect(result.current.stats).toBeTruthy();
  });

  it('should handle refetch', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    // Refetch 호출
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.stats).toBeTruthy();
  });

  it('should handle bestSubject fallback to name when theme_id not found', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [
        { code: 1, theme_id: null, name: 'Math' },
      ],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [
          { theme_code: 1, level: 1, best_score: 100 },
        ],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    } as never);

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
    expect(result.current.stats?.bestSubject).toBe('Math');
  });


  it('should handle RPC catch block with status 404', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    // Mock RPC to throw error with status 404
    vi.mocked(supabase.rpc).mockImplementation(() => {
      const error = { status: 404, code: 'PGRST116' };
      throw error;
    });

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });

  it('should handle RPC catch block with other error', async () => {
    vi.mocked(storage.getString).mockReturnValue(null);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
      error: null,
    } as never);

    const mockProfilesSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            total_mastery_score: 1000,
            current_tier_level: 2,
            cycle_promotion_pending: false,
            pending_cycle_score: 0,
          },
          error: null,
        }),
      })),
    }));

    const mockThemeMappingSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockUserLevelRecordsSelect = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
        } as never;
      }
      if (table === 'theme_mapping') {
        return {
          select: mockThemeMappingSelect,
        } as never;
      }
      if (table === 'user_level_records') {
        return {
          select: mockUserLevelRecordsSelect,
        } as never;
      }
      return {
        select: vi.fn(),
      } as never;
    });

    // Mock RPC to throw error without status 404
    vi.mocked(supabase.rpc).mockImplementation(() => {
      const error = { status: 500, code: 'PGRST500' };
      throw error;
    });

    const { result } = renderHook(() => useMyPageStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.stats).toBeTruthy();
  });
});

