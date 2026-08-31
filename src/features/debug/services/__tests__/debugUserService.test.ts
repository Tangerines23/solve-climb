import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debugUserService } from '../debugUserService';
import { supabase } from '@/utils/supabaseClient';
import { useUserStore } from '@/stores/useUserStore';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('DebugUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({
      minerals: 0,
      stamina: 5,
      inventory: [],
    });
  });

  describe('debugAddItems', () => {
    it('should call debug_grant_items RPC and refresh user data', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Items Added' },
        error: null,
      } as any);

      const fetchSpy = vi.spyOn(useUserStore.getState(), 'fetchUserData').mockResolvedValue();

      await debugUserService.debugAddItems();

      expect(supabase.rpc).toHaveBeenCalledWith('debug_grant_items');
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('debugResetItems', () => {
    it('should call debug_reset_inventory RPC with user id', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user123' } } } as any,
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Reset' },
        error: null,
      } as any);

      await debugUserService.debugResetItems();

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_inventory', { p_user_id: 'user123' });
    });

    it('should handle anonymous session fallback', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as any);

      await debugUserService.debugResetItems();

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_inventory', {
        p_user_id: 'anonymous-debug-user',
      });
    });
  });

  describe('debugRemoveItems', () => {
    it('should decrease inventory quantities', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user123' } } as any,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ item_id: 'item1', quantity: 10 }], error: null }),
      } as any);
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as any);

      await debugUserService.debugRemoveItems();

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_inventory_quantity', {
        p_user_id: 'user123',
        p_item_id: 'item1',
        p_quantity: 5,
      });
    });

    it('should handle remove items failure gracefully when inventory query fails', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user123' } } as any,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      } as any);

      await debugUserService.debugRemoveItems();

      expect(supabase.rpc).not.toHaveBeenCalledWith('debug_set_inventory_quantity');
    });
  });

  describe('debugSetStamina', () => {
    it('should call debug_set_stamina RPC and update state', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true }, error: null } as any);

      await debugUserService.debugSetStamina(50);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_stamina', { p_stamina: 50 });
      expect(useUserStore.getState().stamina).toBe(50);
    });
  });

  describe('debugSetMinerals', () => {
    it('should call debug_set_minerals RPC and update state', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true }, error: null } as any);

      await debugUserService.debugSetMinerals(1000);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_minerals', { p_minerals: 1000 });
      expect(useUserStore.getState().minerals).toBe(1000);
    });
  });
});
