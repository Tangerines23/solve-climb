import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserStore } from '../useUserStore';
import { supabase } from '../../utils/supabaseClient';
import { AdService } from '../../utils/adService';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          then: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('../../utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn((promise) => promise),
}));

vi.mock('../../utils/adService', () => ({
  AdService: {
    showRewardedAd: vi.fn(),
  },
}));

// Mock useDebugStore to avoid actual store side effects
vi.mock('../useDebugStore', () => ({
  useDebugStore: {
    getState: vi.fn(() => ({ infiniteStamina: false })),
  },
}));

describe('useUserStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useUserStore.setState({
      minerals: 0,
      stamina: 5,
      inventory: [],
      isLoading: false,
      lastStaminaConsumeTime: 0,
    });
  });

  it('should initialize with default values', () => {
    const state = useUserStore.getState();
    expect(state.minerals).toBe(0);
    expect(state.stamina).toBe(5);
    expect(state.inventory).toEqual([]);
  });

  describe('updateNickname', () => {
    it('should call rpc_update_nickname and refresh data', async () => {
      const mockRpc = vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Updated' },
        error: null,
      } as any);

      const result = await useUserStore.getState().updateNickname('NewName');

      expect(mockRpc).toHaveBeenCalledWith('rpc_update_nickname', { p_nickname: 'NewName' });
      expect(result.success).toBe(true);
    });

    it('should handle error when updating nickname', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Error' } as any,
      } as any);

      const result = await useUserStore.getState().updateNickname('NewName');
      expect(result.success).toBe(false);
    });
  });

  describe('fetchUserData', () => {
    it('should fetch profile and inventory', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user123', is_anonymous: false } } as any,
        error: null,
      });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { minerals: 100, stamina: 10, last_ad_stamina_recharge: '2024-01-01' },
              error: null,
            }),
          } as any;
        }
        if (table === 'inventory') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  quantity: 2,
                  items: { id: 1, code: 'item1', name: 'Item 1', description: 'Desc' },
                },
              ],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      await useUserStore.getState().fetchUserData();

      const state = useUserStore.getState();
      expect(state.minerals).toBe(100);
      expect(state.stamina).toBe(10);
      expect(state.inventory).toHaveLength(1);
      expect(state.inventory[0].code).toBe('item1');
    });
  });

  describe('consumeStamina', () => {
    it('should call consume_stamina RPC and decrement local stamina', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await useUserStore.getState().consumeStamina();

      expect(supabase.rpc).toHaveBeenCalledWith('consume_stamina');
      expect(result.success).toBe(true);
      expect(useUserStore.getState().stamina).toBe(4);
    });

    it('should throttle repeated calls', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await useUserStore.getState().consumeStamina();
      const result = await useUserStore.getState().consumeStamina();

      expect(supabase.rpc).toHaveBeenCalledTimes(1);
      expect(result.message).toBe('Already consumed');
    });

    it('should skip if infiniteStamina is enabled', async () => {
      const { useDebugStore } = await import('../useDebugStore');
      vi.mocked(useDebugStore.getState).mockReturnValue({ infiniteStamina: true } as any);

      const result = await useUserStore.getState().consumeStamina();

      expect(result.message).toBe('Infinite Stamina (Debug)');
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('purchaseItem', () => {
    it('should call purchase_item RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Purchased' },
        error: null,
      } as any);

      const result = await useUserStore.getState().purchaseItem(1);

      expect(supabase.rpc).toHaveBeenCalledWith('purchase_item', { p_item_id: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe('consumeItem', () => {
    it('should call consume_item RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Consumed' },
        error: null,
      } as any);

      const result = await useUserStore.getState().consumeItem(1);

      expect(supabase.rpc).toHaveBeenCalledWith('consume_item', { p_item_id: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe('recoverStaminaAds', () => {
    it('should call secure_reward_ad_view after showing ad', async () => {
      vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, stamina: 10 },
        error: null,
      } as any);

      const result = await useUserStore.getState().recoverStaminaAds();

      expect(AdService.showRewardedAd).toHaveBeenCalledWith('stamina_recharge');
      expect(supabase.rpc).toHaveBeenCalledWith('secure_reward_ad_view', {
        p_ad_type: 'stamina_recharge',
      });
      expect(result.success).toBe(true);
    });

    it('should fail if ad fails', async () => {
      vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: false, error: 'Failed' });

      const result = await useUserStore.getState().recoverStaminaAds();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed');
    });
  });

  describe('setters', () => {
    it('setMinerals should update state', () => {
      useUserStore.getState().setMinerals(500);
      expect(useUserStore.getState().minerals).toBe(500);
    });

    it('setStamina should update state', () => {
      useUserStore.getState().setStamina(20);
      expect(useUserStore.getState().stamina).toBe(20);
    });
  });

  describe('debug methods', () => {
    it('debugAddItems should call RPC', async () => {
      await useUserStore.getState().debugAddItems();
      expect(supabase.rpc).toHaveBeenCalledWith('debug_grant_items');
    });

    it('debugResetItems should call RPC', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user123' } } } as any,
        error: null,
      });
      await useUserStore.getState().debugResetItems();
      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_inventory', { p_user_id: 'user123' });
    });

    it('debugRemoveItems should decrease inventory quantities', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user123' } } as any,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ item_id: 'item1', quantity: 10 }], error: null }),
      } as any);

      await useUserStore.getState().debugRemoveItems();
      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_inventory_quantity', expect.any(Object));
    });
  });

  describe('checkStamina', () => {
    it('should call check_and_recover_stamina', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user123' } } } as any,
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { stamina: 8 },
        error: null,
      } as any);

      await useUserStore.getState().checkStamina();
      expect(useUserStore.getState().stamina).toBe(8);
    });
  });
});
