import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserStore } from '../useUserStore';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
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

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not throw error and maintain initial state
    expect(result.current.minerals).toBe(0);
  });

  it('should handle fetch user data error', async () => {
    vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

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

    act(() => {
      result.current.setStamina(5);
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
});

