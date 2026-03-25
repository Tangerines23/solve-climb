import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import {
  validatedRpc,
  ItemActionResponseSchema,
  CommonResponseSchema,
} from '../utils/rpcValidator';
import { PostgrestError } from '@supabase/supabase-js';
import { AdService } from '../utils/adService';
import { UI_MESSAGES } from '../constants/ui';
import { UserState, InventoryItem } from '../types/user';

/**
 * 전역 유저 스토어 (Zustand)
 * - 미네랄, 스태미나, 인벤토리 등 유저 상태 관리
 * - 서버 RPC와 연동하여 상태 동기화
 */
export const useUserStore = create<UserState>((set, get) => {
  /**
   * 공통 RPC 처리기
   * - RPC 호출 -> 에러 핸들링 -> (선택적) 데이터 리프레시 -> 표준 응답 반환
   */
  const callRpcAndRefresh = async <T extends { success: boolean; message?: string }>(
    rpcCall: PromiseLike<{ data: T | null; error: unknown }>,
    options: {
      refreshData?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<{ success: boolean; message: string } & Partial<T>> => {
    try {
      const { data, error } = await rpcCall;

      if (error) {
        console.error(`[UserStore RPC Error]`, error);
        return {
          success: false,
          message: options.errorMessage || UI_MESSAGES.COMMON_ERROR,
        } as { success: false; message: string } & Partial<T>;
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || options.errorMessage || '요청 처리에 실패했습니다.',
        } as { success: false; message: string } & Partial<T>;
      }

      if (options.refreshData) {
        await get().fetchUserData();
      }

      return {
        ...(data as T),
        success: true,
        message: data.message || '성공',
      };
    } catch (err) {
      console.error(`[UserStore Unexpected Error]`, err);
      return {
        success: false,
        message: UI_MESSAGES.COMMON_ERROR,
      } as { success: false; message: string } & Partial<T>;
    }
  };

  interface RawInventoryItem {
    quantity: number;
    items: {
      id: number;
      code: string;
      name: string;
      description: string;
    } | null;
  }

  /**
   * 원시 인벤토리 데이터를 포맷팅
   */
  const formatInventory = (raw: RawInventoryItem[] | null): InventoryItem[] => {
    return (
      raw?.map((item) => ({
        id: item?.items?.id || 0,
        code: item?.items?.code || '',
        name: item?.items?.name || '',
        description: item?.items?.description || '',
        quantity: item?.quantity || 0,
      })) || []
    );
  };

  return {
    minerals: 0,
    stamina: 5,
    inventory: [],
    isLoading: false,
    isAnonymous: false,
    lastAdRechargeTime: null,
    lastStaminaConsumeTime: 0,

    handleWatchAd: () => {
      console.log('Watch Ad called (not implemented)');
    },
    showPauseModal: false,
    remainingPauses: 3,
    handlePauseClick: () => set({ showPauseModal: true }),
    handlePauseResume: () => set({ showPauseModal: false }),
    handlePauseExit: () => set({ showPauseModal: false }),

    fetchUserData: async () => {
      set({ isLoading: true });
      try {
        const authResult = await safeSupabaseQuery(supabase.auth.getUser());
        const user = authResult?.data?.user;
        if (!user) return;

        set({ isAnonymous: !!user.is_anonymous });

        const [profileRes, inventoryRes] = await Promise.all([
          safeSupabaseQuery(
            supabase
              .from('profiles')
              .select('minerals, stamina, last_ad_stamina_recharge')
              .eq('id', user.id)
              .maybeSingle()
          ),
          safeSupabaseQuery(
            supabase
              .from('inventory')
              .select('quantity, items (id, code, name, description)')
              .eq('user_id', user.id)
          ),
        ]);

        set({
          minerals: profileRes.data?.minerals || 0,
          stamina: profileRes.data?.stamina || 0,
          lastAdRechargeTime: profileRes.data?.last_ad_stamina_recharge || null,
          inventory: formatInventory(inventoryRes.data as unknown as RawInventoryItem[]),
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    purchaseItem: async (itemId: number) => {
      return callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('purchase_item', { p_item_id: itemId }),
          ItemActionResponseSchema,
          'purchase_item'
        ),
        { refreshData: true, errorMessage: UI_MESSAGES.PURCHASE_FAILED }
      );
    },

    checkStamina: async () => {
      const {
        data: { session },
      } = await safeSupabaseQuery(supabase.auth.getSession());
      if (!session?.user) return;

      const { data, error } = await safeSupabaseQuery(supabase.rpc('check_and_recover_stamina'));
      if (!error && data && typeof data?.stamina === 'number') {
        set({ stamina: data.stamina });
      }
    },

    consumeItem: async (itemId: number) => {
      return callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('consume_item', { p_item_id: itemId }),
          ItemActionResponseSchema,
          'consume_item'
        ),
        { refreshData: true }
      );
    },

    consumeStamina: async () => {
      const now = Date.now();
      if (now - get().lastStaminaConsumeTime < 3000) {
        console.log('[UserStore] Stamina consumption throttled');
        return { success: true, message: 'Already consumed' };
      }

      const res = await callRpcAndRefresh(supabase.rpc('consume_stamina'));
      if (res.success) {
        set((state) => ({
          stamina: Math.max(0, state.stamina - 1),
          lastStaminaConsumeTime: now,
        }));
      }
      return res;
    },

    setMinerals: async (minerals: number) => {
      set({ minerals: Math.max(0, minerals) });
      console.warn('[UserStore] Direct setMinerals is for local state only. Use rewardMinerals.');
    },

    setStamina: (stamina: number) => {
      set({ stamina: Math.max(0, stamina) });
      console.warn('[UserStore] Direct setStamina is for local state only.');
    },

    recoverStaminaAds: async () => {
      const lastRecharge = get().lastAdRechargeTime;
      if (lastRecharge) {
        const waitTime = 6 * 60 * 60 * 1000;
        const remaining = waitTime - (Date.now() - new Date(lastRecharge).getTime());
        if (remaining > 0) {
          return {
            success: false,
            message: `아직 충전할 수 없습니다. (${Math.ceil(remaining / 60000)}분 남음)`,
          };
        }
      }

      const adResult = await AdService.showRewardedAd('stamina_recharge');
      if (!adResult.success) {
        return { success: false, message: adResult.error || '광고 시청에 실패했습니다.' };
      }

      const { data, error } = await safeSupabaseQuery(supabase.rpc('recover_stamina_ads'));
      if (error && (error as PostgrestError).code === 'PGRST202') {
        console.warn('[UserStore] Simulation fallback for recover_stamina_ads');
        get().setStamina(5);
        const nowIso = new Date().toISOString();
        set({ lastAdRechargeTime: nowIso });
        return { success: true, message: UI_MESSAGES.STAMINA_RECHARGED_FULL + ' (시뮬레이션)' };
      }

      if (!error && data?.success) {
        set({
          stamina: data.stamina || 5,
          lastAdRechargeTime: new Date().toISOString(),
        });
        return { success: true, message: UI_MESSAGES.STAMINA_RECHARGED_FULL };
      }

      return { success: false, message: UI_MESSAGES.COMMON_ERROR };
    },

    recoverMineralsAds: async () => {
      const adResult = await AdService.showRewardedAd('mineral_recharge');
      if (!adResult.success) return { success: false, message: UI_MESSAGES.AD_WATCH_FAILED() };

      const res = await callRpcAndRefresh<{ success: boolean; minerals: number }>(
        supabase.rpc('add_minerals', { p_amount: 500 })
      );
      if (res.success && res.minerals !== undefined) {
        set({ minerals: res.minerals });
        return { success: true, message: UI_MESSAGES.MINERAL_RECHARGED(500) };
      }
      return res as { success: false; message: string };
    },

    rewardMinerals: async (amount: number, isBonus = false) => {
      if (amount <= 0) return { success: false, message: 'Invalid amount' };
      const res = await callRpcAndRefresh<{ success: boolean; minerals: number }>(
        supabase.rpc('add_minerals', { p_amount: amount })
      );
      if (res.success && res.minerals !== undefined) {
        set({ minerals: res.minerals });
        return { success: true, message: UI_MESSAGES.MINERAL_REWARD(amount, isBonus) };
      }
      return res as { success: false; message: string };
    },

    debugAddItems: async () => {
      const res = await callRpcAndRefresh(supabase.rpc('debug_grant_items'), { refreshData: true });
      if (res.success) console.log('[DEBUG] Items Added');
    },

    debugResetItems: async () => {
      const {
        data: { user },
      } = await safeSupabaseQuery(supabase.auth.getUser());
      if (!user) return;

      const { error } = await safeSupabaseQuery(
        supabase.from('inventory').delete().eq('user_id', user.id)
      );
      if (!error) await get().fetchUserData();
    },

    debugRemoveItems: async () => {
      const {
        data: { user },
      } = await safeSupabaseQuery(supabase.auth.getUser());
      if (!user) return;

      const { data: inventory } = await safeSupabaseQuery(
        supabase.from('inventory').select('item_id, quantity').eq('user_id', user.id)
      );
      if (!inventory) return;

      await Promise.all(
        inventory.map((item) =>
          validatedRpc(
            supabase.rpc('debug_set_inventory_quantity', {
              p_user_id: user.id,
              p_item_id: item.item_id,
              p_quantity: Math.max(0, item.quantity - 5),
            }),
            CommonResponseSchema,
            'debug_set_inventory_quantity'
          )
        )
      );
      await get().fetchUserData();
    },

    debugSetStamina: async (amount: number) => {
      const {
        data: { user },
      } = await safeSupabaseQuery(supabase.auth.getUser());
      if (!user) return;

      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_update_profile_stats', { p_user_id: user.id, p_stamina: amount }),
          CommonResponseSchema,
          'debug_update_profile_stats'
        )
      );
      if (res.success) set({ stamina: Math.max(0, amount) });
    },

    debugSetMinerals: async (amount: number) => {
      const {
        data: { user },
      } = await safeSupabaseQuery(supabase.auth.getUser());
      if (!user) return;

      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_update_profile_stats', { p_user_id: user.id, p_minerals: amount }),
          CommonResponseSchema,
          'debug_update_profile_stats'
        )
      );
      if (res.success) set({ minerals: Math.max(0, amount) });
    },

    refundStamina: async () => {
      const {
        data: { user },
      } = await safeSupabaseQuery(supabase.auth.getUser());
      if (!user) return { success: false, message: UI_MESSAGES.LOGIN_REQUIRED };

      const current = get().stamina;
      if (current < 5) set({ stamina: current + 1 });

      try {
        const { error } = await safeSupabaseQuery(supabase.rpc('recover_stamina_ads'));
        if (error && (error as PostgrestError).code === 'PGRST202') {
          return { success: true, message: 'Stamina refunded (Simulation)' };
        }
        if (error) throw error;
        return { success: true, message: 'Stamina refunded' };
      } catch (err) {
        console.error('Error refunding stamina:', err);
        return { success: false, message: 'Failed to refund stamina' };
      }
    },
  };
});
