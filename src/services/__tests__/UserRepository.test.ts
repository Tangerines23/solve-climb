import { describe, it, expect, vi } from 'vitest';
import { UserRepository, RawInventoryItem } from '@/services/UserRepository';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { UI_MESSAGES } from '@/constants/ui';
import { InventoryItem } from '@/types/user';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn((query) => query),
}));

describe('UserRepository', () => {
  describe('formatInventory', () => {
    it('returns formatted InventoryItem[] from raw items', () => {
      const raw: RawInventoryItem[] = [
        { quantity: 2, items: { id: 1, code: 'A', name: 'Item A', description: 'Desc A' } },
        { quantity: -1, items: { id: 2, code: 'B', name: 'Item B', description: 'Desc B' } },
      ];
      const expected: InventoryItem[] = [
        { id: 1, code: 'A', name: 'Item A', description: 'Desc A', quantity: 2 },
        { id: 2, code: 'B', name: 'Item B', description: 'Desc B', quantity: 0 },
      ];
      expect(UserRepository.formatInventory(raw)).toEqual(expected);
    });

    it('filters out items where item.items is null or item.items.code is empty', () => {
      const raw: RawInventoryItem[] = [
        { quantity: 2, items: null },
        { quantity: 2, items: { id: 1, code: '', name: 'Item A', description: 'Desc A' } },
      ];
      const expected: InventoryItem[] = [];
      expect(UserRepository.formatInventory(raw)).toEqual(expected);
    });

    it('returns [] when raw is null, undefined, or not an array', () => {
      expect(UserRepository.formatInventory(null)).toEqual([]);
      expect(UserRepository.formatInventory(undefined)).toEqual([]);
      expect(UserRepository.formatInventory({} as any)).toEqual([]);
    });

    it('clamps negative quantity to 0', () => {
      const raw: RawInventoryItem[] = [
        { quantity: -5, items: { id: 1, code: 'A', name: 'Item A', description: 'Desc A' } },
      ];
      const expected: InventoryItem[] = [
        { id: 1, code: 'A', name: 'Item A', description: 'Desc A', quantity: 0 },
      ];
      expect(UserRepository.formatInventory(raw)).toEqual(expected);
    });
  });

  describe('callRpc', () => {
    it('returns { success: true, message: "OK" } when RPC succeeds', async () => {
      const mockRpcCall = Promise.resolve({ data: { success: true, message: 'OK' }, error: null });
      const result = await UserRepository.callRpc(mockRpcCall);
      expect(result).toEqual({ success: true, message: 'OK' });
    });

    it('returns { success: false, message: "..." } when RPC returns error or success: false', async () => {
      const mockRpcCall = Promise.resolve({
        data: { success: false, message: 'Error' },
        error: null,
      });
      const result = await UserRepository.callRpc(mockRpcCall);
      expect(result).toEqual({ success: false, message: 'Error' });
    });

    it('extracts errorCode from error object when present', async () => {
      const mockRpcCall = Promise.resolve({ data: null, error: { code: '404' } });
      const result = await UserRepository.callRpc(mockRpcCall);
      expect(result).toEqual({
        success: false,
        message: UI_MESSAGES.COMMON_ERROR,
        errorCode: '404',
      });
    });

    it('catches unexpected exceptions and returns { success: false, message: COMMON_ERROR }', async () => {
      const errorPromise = Promise.reject(new Error('Unexpected error'));
      errorPromise.catch(() => {});
      const result = await UserRepository.callRpc(errorPromise);
      expect(result).toEqual({ success: false, message: UI_MESSAGES.COMMON_ERROR });
    });
  });

  describe('fetchUserData', () => {
    it('queries "profiles" and "inventory" tables with userId', async () => {
      const mockProfileRes = {
        data: { minerals: 100, stamina: 50, updated_at: '2023-01-01' },
        error: null,
      };
      const mockInventoryRes = {
        data: [{ quantity: 1, items: { id: 1, code: 'A', name: 'Item A', description: 'Desc A' } }],
        error: null,
      };

      vi.mocked(safeSupabaseQuery).mockImplementationOnce(() => Promise.resolve(mockProfileRes));
      vi.mocked(safeSupabaseQuery).mockImplementationOnce(() => Promise.resolve(mockInventoryRes));

      const result = await UserRepository.fetchUserData('user123');
      expect(result).toEqual({
        profile: mockProfileRes.data,
        profileError: mockProfileRes.error,
        inventory: mockInventoryRes.data,
        inventoryError: mockInventoryRes.error,
      });
    });
  });

  describe('promoteToNextCycle', () => {
    it('invokes promote_to_next_cycle RPC via callRpc', async () => {
      const mockRpcCall = Promise.resolve({
        data: { success: true, message: 'Promoted' },
        error: null,
      });
      vi.mocked(supabase.rpc).mockReturnValue(mockRpcCall);

      const result = await UserRepository.promoteToNextCycle();
      expect(result).toEqual({ success: true, message: 'Promoted' });
    });
  });
});
