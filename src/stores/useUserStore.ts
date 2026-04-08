import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import {
  validatedRpc,
  ItemActionResponseSchema,
  CommonResponseSchema,
} from '../utils/rpcValidator';
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
      // Use safeSupabaseQuery to handle debug latency and forced errors
      const { data, error } = await safeSupabaseQuery(rpcCall, {
        context: 'UserStoreRPC',
      });

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
    updateNickname: async (nickname: string) => {
      const res = await callRpcAndRefresh<{ success: boolean; message: string }>(
        supabase.rpc('rpc_update_nickname', { p_nickname: nickname }),
        { refreshData: true, errorMessage: '닉네임 업데이트에 실패했습니다.' }
      );
      return res;
    },

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
      // infiniteStamina 체크 (디버그 모드)
      const { useDebugStore } = await import('./useDebugStore');
      const { infiniteStamina } = useDebugStore.getState();

      if (infiniteStamina) {
        console.log('[DEBUG] Infinite Stamina active: skipping consume');
        return { success: true, message: 'Infinite Stamina (Debug)' };
      }

      const now = Date.now();
      // 중복 요청 방지 (디바운스/쓰로틀링)
      if (now - get().lastStaminaConsumeTime < 2000) {
        return { success: true, message: 'Throttled' };
      }

      // [Server-Only Truth] 더 이상 'consume_stamina' RPC를 직접 호출하지 않습니다.
      // 스태미나는 서버의 'create_game_session' RPC 호출 시 원자적으로(Atomically) 차감됩니다.
      // 여기서는 즉각적인 UI 피드백을 위해 로컬 상태만 먼저 업데이트합니다.
      set((state) => ({
        stamina: Math.max(0, state.stamina - 1),
        lastStaminaConsumeTime: now,
      }));

      return {
        success: true,
        message: 'Stamina consumption handled by server-side session creation',
      };
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
      const adResult = await AdService.showRewardedAd('stamina_recharge');
      if (!adResult.success) {
        return { success: false, message: adResult.error || '광고 시청에 실패했습니다.' };
      }

      const res = await callRpcAndRefresh<{
        success: boolean;
        stamina: number;
        last_ad_stamina_recharge: string;
      }>(supabase.rpc('secure_reward_ad_view', { p_ad_type: 'stamina_recharge' }), {
        refreshData: true,
      });

      return res as { success: boolean; message: string };
    },

    recoverMineralsAds: async () => {
      const adResult = await AdService.showRewardedAd('mineral_recharge');
      if (!adResult.success) return { success: false, message: UI_MESSAGES.AD_WATCH_FAILED() };

      return callRpcAndRefresh<{ success: boolean; minerals: number }>(
        supabase.rpc('secure_reward_ad_view', { p_ad_type: 'mineral_recharge' }),
        { refreshData: true }
      );
    },

    rewardMinerals: async (amount: number) => {
      if (amount <= 0) return { success: false, message: 'Invalid amount' };
      // [Security Warning] Generic mineral rewards are now discouraged.
      // Use specific RPCs like secure_reward_ad_view or game result submission.
      return { success: false, message: '보안 정책에 따라 직접적인 미네랄 지급이 제한됩니다.' };
    },

    debugAddItems: async () => {
      const res = await callRpcAndRefresh(supabase.rpc('debug_grant_items'), { refreshData: true });
      if (res.success) console.log('[DEBUG] Items Added');
    },

    debugResetItems: async () => {
      const {
        data: { session },
      } = await safeSupabaseQuery(supabase.auth.getSession());
      const userId = session?.user?.id || 'anonymous-debug-user';

      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_reset_inventory', { p_user_id: userId }),
          CommonResponseSchema,
          'debug_reset_inventory'
        ),
        { refreshData: true }
      );
      if (res.success) console.log('[DEBUG] Inventory Reset');
    },

    debugRemoveItems: async () => {
      const {
        data: { user: _user },
      } = await safeSupabaseQuery(supabase.auth.getUser());
      const userId = _user?.id || 'anonymous-debug-user';

      const { data: inventory } = await safeSupabaseQuery(
        supabase.from('inventory').select('item_id, quantity').eq('user_id', userId)
      );
      if (!inventory) return;

      await Promise.all(
        inventory.map((item) =>
          callRpcAndRefresh(
            validatedRpc(
              supabase.rpc('debug_set_inventory_quantity', {
                p_user_id: userId,
                p_item_id: item.item_id,
                p_quantity: Math.max(0, item.quantity - 5),
              }),
              CommonResponseSchema,
              'debug_set_inventory_quantity'
            )
          )
        )
      );
      await get().fetchUserData();
    },

    debugSetStamina: async (amount: number) => {
      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_set_stamina', { p_stamina: amount }),
          CommonResponseSchema,
          'debug_set_stamina'
        ),
        { refreshData: true }
      );
      if (res.success) set({ stamina: Math.max(0, amount) });
    },

    debugSetMinerals: async (amount: number) => {
      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_set_minerals', { p_minerals: amount }),
          CommonResponseSchema,
          'debug_set_minerals'
        ),
        { refreshData: true }
      );
      if (res.success) set({ minerals: Math.max(0, amount) });
    },

    refundStamina: async () => {
      // [Security Policy] Stamina refund is now strictly server-side.
      // This function will be replaced by a secure RPC call in a future update if required.
      // Currently, stamina is only consumed upon successful game start.
      return { success: false, message: '보안 정책에 따라 직접적인 스태미나 수정이 제한됩니다.' };
    },
  };
});
