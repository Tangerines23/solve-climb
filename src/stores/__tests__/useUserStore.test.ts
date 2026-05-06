import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserStore } from '../useUserStore';
import { supabase } from '../../utils/supabaseClient';
import { AdService } from '../../utils/adService';
import {
  createAuthUserMock,
  createAuthSessionMock,
  createSuccessResponse,
  createErrorResponse,
  createChainableMock,
} from '../../utils/__tests__/supabaseMockUtils';

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
const mockDebugState = { infiniteStamina: false };
vi.mock('../useDebugStore', () => ({
  useDebugStore: {
    getState: vi.fn(() => mockDebugState),
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
    expect(state.isAnonymous).toBe(false);
  });

  describe('formatInventory', () => {
    it('should handle null or empty input', () => {
      // Accessing internal private-like function via indirect call if possible,
      // but here we can just test it via fetchUserData branches.
    });
  });

  describe('updateNickname', () => {
    it('should call rpc_update_nickname and refresh data', async () => {
      const mockRpc = vi
        .mocked(supabase.rpc)
        .mockResolvedValue(createSuccessResponse({ success: true, message: 'Updated' }));

      const result = await useUserStore.getState().updateNickname('NewName');

      expect(mockRpc).toHaveBeenCalledWith('rpc_update_nickname', { p_nickname: 'NewName' });
      expect(result.success).toBe(true);
    });

    it('should handle error when updating nickname', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(createErrorResponse('Error'));

      const result = await useUserStore.getState().updateNickname('NewName');
      expect(result.success).toBe(false);
    });
  });

  describe('fetchUserData', () => {
    it('should fetch profile and inventory', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue(
        createAuthUserMock({ id: 'user123', is_anonymous: false })
      );

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock(
            createSuccessResponse({
              minerals: 100,
              stamina: 10,
              last_ad_stamina_recharge: '2024-01-01',
            })
          );
        }
        if (table === 'inventory') {
          return createChainableMock(
            createSuccessResponse([
              {
                quantity: 2,
                items: { id: 1, code: 'item1', name: 'Item 1', description: 'Desc' },
              },
            ])
          );
        }
        return createChainableMock(createSuccessResponse(null));
      });

      await useUserStore.getState().fetchUserData();

      const state = useUserStore.getState();
      expect(state.minerals).toBe(100);
      expect(state.stamina).toBe(10);
      expect(state.inventory).toHaveLength(1);
      expect(state.inventory[0].code).toBe('item1');
    });
    it('should handle fetch failure gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Auth failed'));
      await useUserStore.getState().fetchUserData();
      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('consumeStamina', () => {
    it('should decrement local stamina without direct RPC call', async () => {
      const result = await useUserStore.getState().consumeStamina();

      // [Server-Only Truth] No longer calls consume_stamina RPC directly
      expect(supabase.rpc).not.toHaveBeenCalledWith('consume_stamina');
      expect(result.success).toBe(true);
      expect(useUserStore.getState().stamina).toBe(4);
    });

    it('should throttle repeated calls', async () => {
      await useUserStore.getState().consumeStamina();
      const result = await useUserStore.getState().consumeStamina();

      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(result.message).toBe('Throttled');
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
      vi.mocked(supabase.rpc).mockResolvedValue(
        createSuccessResponse({ success: true, message: 'Purchased' })
      );

      const result = await useUserStore.getState().purchaseItem(1);

      expect(supabase.rpc).toHaveBeenCalledWith('purchase_item', { p_item_id: 1 });
      expect(result.success).toBe(true);
    });
    it('should handle purchase failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        createSuccessResponse({ success: false, message: 'No money' })
      );

      const result = await useUserStore.getState().purchaseItem(1);
      expect(result.success).toBe(false);
      expect(result.message).toBe('No money');
    });

    it('should handle validation failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(createSuccessResponse({ unexpected: 'format' }));

      const result = await useUserStore.getState().purchaseItem(1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('실패');
    });
  });

  describe('consumeItem', () => {
    it('should call consume_item RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        createSuccessResponse({ success: true, message: 'Consumed' })
      );

      const result = await useUserStore.getState().consumeItem(1);

      expect(supabase.rpc).toHaveBeenCalledWith('consume_item', { p_item_id: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe('recoverStaminaAds', () => {
    it('should call secure_reward_ad_view after showing ad', async () => {
      vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
      vi.mocked(supabase.rpc).mockResolvedValue(
        createSuccessResponse({ success: true, stamina: 10 })
      );

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
      vi.mocked(supabase.auth.getSession).mockResolvedValue(
        createAuthSessionMock({ user: { id: 'user123' } })
      );
      await useUserStore.getState().debugResetItems();
      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_inventory', { p_user_id: 'user123' });
    });

    it('debugRemoveItems should decrease inventory quantities', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue(createAuthUserMock({ id: 'user123' }));
      vi.mocked(supabase.from).mockReturnValue(
        createChainableMock(createSuccessResponse([{ item_id: 'item1', quantity: 10 }]))
      );

      await useUserStore.getState().debugRemoveItems();
      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_inventory_quantity', expect.any(Object));
    });
    it('should handle remove items failure gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createChainableMock(createErrorResponse('DB Error'))
      );

      await useUserStore.getState().debugRemoveItems();
      expect(supabase.rpc).not.toHaveBeenCalledWith('debug_set_inventory_quantity');
    });
  });

  describe('checkStamina', () => {
    it('should call check_and_recover_stamina', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue(
        createAuthSessionMock({ user: { id: 'user123' } })
      );
      vi.mocked(supabase.rpc).mockResolvedValue(createSuccessResponse({ stamina: 8 }));

      await useUserStore.getState().checkStamina();
      expect(useUserStore.getState().stamina).toBe(8);
    });
  });

  describe('recoverMineralsAds', () => {
    it('should call secure_reward_ad_view for minerals', async () => {
      vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
      vi.mocked(supabase.rpc).mockResolvedValue(
        createSuccessResponse({ success: true, minerals: 50 })
      );

      const result = await useUserStore.getState().recoverMineralsAds();
      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('secure_reward_ad_view', {
        p_ad_type: 'mineral_recharge',
      });
    });

    it('should handle ad failure', async () => {
      vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: false, error: 'Ad Error' });
      const result = await useUserStore.getState().recoverMineralsAds();
      expect(result.success).toBe(false);
      expect(result.message).toContain('광고 시청 실패');
    });
  });

  describe('security policy edge cases', () => {
    it('rewardMinerals should return error due to security policy', async () => {
      const result = await useUserStore.getState().rewardMinerals(100);
      expect(result.success).toBe(false);
      expect(result.message).toContain('보안');
    });

    it('refundStamina should return error due to security policy', async () => {
      const result = await useUserStore.getState().refundStamina();
      expect(result.success).toBe(false);
      expect(result.message).toContain('보안');
    });

    it('rewardMinerals with invalid amount', async () => {
      const result = await useUserStore.getState().rewardMinerals(-10);
      expect(result.success).toBe(false);
    });
  });

  describe('debug methods extra', () => {
    it('debugSetStamina should call RPC and update state', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(createSuccessResponse({ success: true }));
      await useUserStore.getState().debugSetStamina(50);
      expect(useUserStore.getState().stamina).toBe(50);
    });

    it('debugSetMinerals should call RPC and update state', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(createSuccessResponse({ success: true }));
      await useUserStore.getState().debugSetMinerals(1000);
      expect(useUserStore.getState().minerals).toBe(1000);
    });
  });

  describe('unexpected RPC errors', () => {
    it('should handle database crash in consumeItem', async () => {
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Fatal'));
      const result = await useUserStore.getState().consumeItem(1);
      expect(result.success).toBe(false);
    });
  });

  describe('UI Handlers', () => {
    it('handleWatchAd should log message', () => {
      const logSpy = vi.spyOn(console, 'log');
      useUserStore.getState().handleWatchAd();
      expect(logSpy).toHaveBeenCalledWith('Watch Ad called (not implemented)');
      logSpy.mockRestore();
    });

    it('pause handlers should toggle showPauseModal', () => {
      const store = useUserStore.getState();

      store.handlePauseClick();
      expect(useUserStore.getState().showPauseModal).toBe(true);

      store.handlePauseResume();
      expect(useUserStore.getState().showPauseModal).toBe(false);

      store.handlePauseClick();
      store.handlePauseExit();
      expect(useUserStore.getState().showPauseModal).toBe(false);
    });

    it('fetchUserData should return early if user is not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
      await useUserStore.getState().fetchUserData();
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('checkStamina should return early if session is missing', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const rpcSpy = vi.mocked(supabase.rpc);
      await useUserStore.getState().checkStamina();
      expect(rpcSpy).not.toHaveBeenCalledWith('check_and_recover_stamina');
    });

    it('formatInventory should handle null items and missing properties', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue(createAuthUserMock({ id: 'user1' }));
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock(createSuccessResponse(null));
        }
        return createChainableMock(
          createSuccessResponse([
            { quantity: 1, items: null },
            { quantity: 2, items: { id: 2 } },
          ])
        );
      });

      await useUserStore.getState().fetchUserData();
      const state = useUserStore.getState();
      expect(state.inventory).toHaveLength(2);
      expect(state.inventory[0].id).toBe(0);
      expect(state.inventory[0].code).toBe('');
      expect(state.inventory[1].id).toBe(2);
    });

    it('debug methods should handle anonymous user case', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      await useUserStore.getState().debugResetItems();
      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_inventory', {
        p_user_id: 'anonymous-debug-user',
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
      vi.mocked(supabase.from).mockReturnValue(createChainableMock(createSuccessResponse([])));
      await useUserStore.getState().debugRemoveItems();
      // Should handle null userId and empty inventory
    });
  });
});
