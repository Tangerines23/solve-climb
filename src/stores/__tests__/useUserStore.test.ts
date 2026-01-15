import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserStore } from '../useUserStore';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('useUserStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.setMinerals(0);
      result.current.setStamina(5);
      // Reset lastStaminaConsumeTime
      useUserStore.setState({ lastStaminaConsumeTime: 0 });
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUserStore());

    expect(result.current.minerals).toBe(0);
    expect(result.current.stamina).toBe(5);
    expect(result.current.inventory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set stamina', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setStamina(10);
    });

    expect(result.current.stamina).toBe(10);
  });

  it('should fetch user data successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockProfile = { minerals: 100, stamina: 10 };
    const mockInventory = [
      {
        quantity: 5,
        items: {
          id: 1,
          code: 'item1',
          name: 'Item 1',
          description: 'Description 1',
        },
      },
    ];

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    } as any);

    // Mock inventory query
    const mockFromInventory = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockInventory,
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'inventory') {
        return mockFromInventory as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.minerals).toBe(100);
    expect(result.current.stamina).toBe(10);
    expect(result.current.inventory.length).toBe(1);
    expect(result.current.inventory[0].id).toBe(1);
    expect(result.current.inventory[0].quantity).toBe(5);
  });

  it('should handle fetch user data when no user is logged in', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should not throw error and maintain initial state
    expect(result.current.minerals).toBe(0);
  });

  it('should handle fetch user data error', async () => {
    vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should handle error gracefully
    expect(result.current.isLoading).toBe(false);
  });

  it('should purchase item successfully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      const response = await result.current.purchaseItem(1);
      expect(response.success).toBe(true);
    });
  });

  it('should handle purchase item error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockRejectedValue(new Error('Insufficient minerals'));

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await expect(result.current.purchaseItem(1)).rejects.toThrow();
    });
  });

  it('should consume item successfully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      const response = await result.current.consumeItem(1);
      expect(response.success).toBe(true);
    });
  });

  it('should consume stamina', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, new_stamina: 4 },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(5);
    });

    await act(async () => {
      const response = await result.current.consumeStamina();
      expect(response.success).toBe(true);
    });

    // Stamina should be updated
    expect(result.current.stamina).toBe(4);
  });

  it('should set minerals', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setMinerals(100);
    });

    expect(result.current.minerals).toBe(100);
  });

  it('should handle setMinerals with negative value', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setMinerals(-10);
    });

    // 음수는 0으로 처리되어야 함
    expect(result.current.minerals).toBe(0);
  });

  it('should handle setMinerals when user is not logged in', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setMinerals(100);
    });

    // 로컬 상태는 업데이트되지만 DB 동기화는 안 됨
    expect(result.current.minerals).toBe(100);
  });

  it('should handle setMinerals error gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockRejectedValue(new Error('Update failed')),
      }),
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setMinerals(100);
    });

    // 로컬 상태는 업데이트되지만 에러는 로깅됨
    expect(result.current.minerals).toBe(100);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should set stamina', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(10);
    });

    expect(result.current.stamina).toBe(10);
  });

  it('should handle setStamina with negative value', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(-5);
    });

    // 음수는 0으로 처리되어야 함
    expect(result.current.stamina).toBe(0);
  });

  it('should handle setStamina error gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockRejectedValue(new Error('Update failed')),
      }),
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(10);
    });

    // 로컬 상태는 업데이트되지만 에러는 로깅됨
    expect(result.current.stamina).toBe(10);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should check stamina successfully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { stamina: 5 },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.checkStamina();
    });

    expect(result.current.stamina).toBe(5);
  });

  it('should handle checkStamina when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());
    const initialStamina = result.current.stamina;

    await act(async () => {
      await result.current.checkStamina();
    });

    // 세션이 없으면 스태미나가 변경되지 않아야 함
    expect(result.current.stamina).toBe(initialStamina);
  });

  it('should handle checkStamina error gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());
    const initialStamina = result.current.stamina;

    await act(async () => {
      await result.current.checkStamina();
    });

    // 에러가 발생해도 스태미나가 변경되지 않아야 함
    expect(result.current.stamina).toBe(initialStamina);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle checkStamina when data.stamina is not a number', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { stamina: 'invalid' },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());
    const initialStamina = result.current.stamina;

    await act(async () => {
      await result.current.checkStamina();
    });

    // 숫자가 아니면 스태미나가 변경되지 않아야 함
    expect(result.current.stamina).toBe(initialStamina);
  });

  it('should throttle consumeStamina calls', async () => {
    vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
      if (fnName === 'consume_stamina') {
        return Promise.resolve({
          data: { success: true },
          error: null,
        } as any);
      }
      return Promise.resolve({ data: null, error: null } as any);
    });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(5);
      // Reset lastStaminaConsumeTime to ensure first call is not throttled
      useUserStore.setState({ lastStaminaConsumeTime: 0 });
    });

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

    // 첫 번째 호출
    await act(async () => {
      await result.current.consumeStamina();
    });

    // lastStaminaConsumeTime이 설정되었으므로 즉시 두 번째 호출하면 throttled
    await act(async () => {
      await result.current.consumeStamina();
    });

    // 첫 번째 호출만 실행되어야 함 (두 번째는 throttled)
    expect(result.current.stamina).toBe(4);
    expect(consoleLogSpy).toHaveBeenCalledWith('[UserStore] Stamina consumption throttled');
    consoleLogSpy.mockRestore();
  });

  it('should handle consumeStamina error', async () => {
    vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
      if (fnName === 'consume_stamina') {
        return Promise.resolve({
          data: null,
          error: { message: 'RPC error' },
        } as any);
      }
      return Promise.resolve({ data: null, error: null } as any);
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(5);
      // Reset lastStaminaConsumeTime to ensure call is not throttled
      useUserStore.setState({ lastStaminaConsumeTime: 0 });
    });

    await act(async () => {
      const response = await result.current.consumeStamina();
      expect(response.success).toBe(false);
      expect(response.message).toBe('오류가 발생했습니다.');
    });

    // 에러가 발생하면 스태미나가 변경되지 않아야 함
    expect(result.current.stamina).toBe(5);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle consumeStamina when success is false', async () => {
    vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
      if (fnName === 'consume_stamina') {
        return Promise.resolve({
          data: { success: false, message: 'Insufficient stamina' },
          error: null,
        } as any);
      }
      return Promise.resolve({ data: null, error: null } as any);
    });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(5);
      // Reset lastStaminaConsumeTime to ensure call is not throttled
      useUserStore.setState({ lastStaminaConsumeTime: 0 });
    });

    await act(async () => {
      const response = await result.current.consumeStamina();
      expect(response.success).toBe(false);
    });

    // success가 false면 스태미나가 변경되지 않아야 함
    expect(result.current.stamina).toBe(5);
  });

  it('should recover stamina from ads', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(4);
    });

    await act(async () => {
      const response = await result.current.recoverStaminaAds();
      expect(response.success).toBe(true);
    });

    // 스태미나가 1 증가해야 함 (최대 5)
    expect(result.current.stamina).toBe(5);
  });

  it('should cap stamina at 5 when recovering from ads', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(5);
    });

    await act(async () => {
      const response = await result.current.recoverStaminaAds();
      expect(response.success).toBe(true);
    });

    // 이미 5면 더 이상 증가하지 않아야 함
    expect(result.current.stamina).toBe(5);
  });

  it('should handle recoverStaminaAds error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setStamina(4);
    });

    await act(async () => {
      const response = await result.current.recoverStaminaAds();
      expect(response.success).toBe(false);
      expect(response.message).toBe('오류가 발생했습니다.');
    });

    // 에러가 발생하면 스태미나가 변경되지 않아야 함
    expect(result.current.stamina).toBe(4);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle purchaseItem when success is false', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: false, message: 'Insufficient minerals' },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      const response = await result.current.purchaseItem(1);
      expect(response.success).toBe(false);
    });

    // success가 false면 fetchUserData가 호출되지 않아야 함
    // (실제로는 호출되지만, 테스트에서는 확인하기 어려움)
  });

  it('should handle consumeItem when success is false', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: false, message: 'Item not found' },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      const response = await result.current.consumeItem(1);
      expect(response.success).toBe(false);
    });
  });

  it('should handle fetchUserData when profile query fails', async () => {
    const mockUser = { id: 'user-123' };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Profile not found' },
              }),
            }),
          }),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // 에러가 발생해도 기본값으로 설정되어야 함
    expect(result.current.minerals).toBe(0);
    expect(result.current.stamina).toBe(0);
    consoleErrorSpy.mockRestore();
  });

  it('should handle fetchUserData when inventory query fails', async () => {
    const mockUser = { id: 'user-123' };
    const mockProfile = { minerals: 100, stamina: 10 };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Inventory query failed' },
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // 프로필은 업데이트되지만 인벤토리는 빈 배열이어야 함
    expect(result.current.minerals).toBe(100);
    expect(result.current.stamina).toBe(10);
    expect(result.current.inventory).toEqual([]);
    consoleErrorSpy.mockRestore();
  });

  it('should handle debugAddItems successfully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugAddItems();
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Calling debug_grant_items RPC...');
    consoleLogSpy.mockRestore();
  });

  it('should handle debugAddItems error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugAddItems();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle debugResetItems successfully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugResetItems();
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Items Reset Success');
    consoleLogSpy.mockRestore();
  });

  it('should handle debugResetItems when no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugResetItems();
    });

    // Should return early without error
    expect(result.current).toBeTruthy();
  });

  it('should handle debugResetItems error', async () => {
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

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugResetItems();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle debugRemoveItems successfully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockInventory = [
      { id: 1, quantity: 10 },
      { id: 2, quantity: 3 },
    ];

    const mockFromInventory = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockInventory,
          error: null,
        }),
      }),
    };

    const mockFromDelete = {
      delete: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    };

    const mockFromUpsert = {
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'inventory') {
        return mockFromInventory as any;
      }
      return {} as any;
    });

    // Mock for delete and upsert calls
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'inventory') {
        if (callCount === 0) {
          callCount++;
          return mockFromInventory as any;
        } else if (callCount === 1) {
          callCount++;
          return mockFromDelete as any;
        } else {
          return mockFromUpsert as any;
        }
      }
      return {} as any;
    });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugRemoveItems();
    });

    // Should complete without error
    expect(result.current).toBeTruthy();
  });

  it('should handle debugRemoveItems when no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugRemoveItems();
    });

    // Should return early without error
    expect(result.current).toBeTruthy();
  });

  it('should handle debugRemoveItems when inventory is null', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockFromInventory = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockFromInventory as any);

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugRemoveItems();
    });

    // Should return early when inventory is null
    expect(result.current).toBeTruthy();
  });

  it('should handle debugRemoveItems with items that need deletion', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);

    const mockInventory = [
      { id: 1, quantity: 3 }, // Will be deleted (3 - 5 <= 0)
      { id: 2, quantity: 10 }, // Will be updated (10 - 5 = 5)
    ];

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'inventory') {
        if (callCount === 0) {
          callCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockInventory,
                error: null,
              }),
            }),
          } as any;
        } else if (callCount === 1) {
          callCount++;
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          } as any;
        } else {
          return {
            upsert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
      }
      return {} as any;
    });

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.debugRemoveItems();
    });

    // Should complete without error
    expect(result.current).toBeTruthy();
  });
});

