import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { useDebugStore } from './useDebugStore';
import {
  validatedRpc,
  ItemActionResponseSchema,
  CommonResponseSchema,
} from '../utils/rpcValidator';
import { AdService } from '../utils/adService';
import { UI_MESSAGES } from '../constants/ui';
import { UserState, InventoryItem } from '../types/user';
import { UserRepository, RawInventoryItem } from '../services/UserRepository';

/**
 * 전역 유저 스토어 (Zustand)
 * - 미네랄, 스태미나, 인벤토리 등 유저 상태 관리
 * - 서버 RPC 및 UserRepository 연동
 */
export const useUserStore = create<UserState>((set, get) => {
  /**
   * 공통 RPC 처리기
   * - UserRepository.callRpc -> (선택적) 데이터 리프레시 -> 표준 응답 반환
   */
  const callRpcAndRefresh = async <T extends { success: boolean; message?: string }>(
    rpcCall: PromiseLike<{ data: T | null; error: unknown }>,
    options: {
      refreshData?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<{ success: boolean; message: string } & Partial<T>> => {
    const res = await UserRepository.callRpc<T>(rpcCall, options);
    if (res.success && options.refreshData) {
      await get().fetchUserData();
    }
    return res;
  };

  /**
   * 원시 인벤토리 데이터를 포맷팅
   */
  const formatInventory = (raw: RawInventoryItem[] | null): InventoryItem[] => {
    return UserRepository.formatInventory(raw);
  };

  return {
    minerals: 0,
    stamina: 5,
    inventory: [],
    isLoading: false,
    isAdLoading: false,
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

        const { profile, inventory: rawInventory } = await UserRepository.fetchUserData(user.id);

        set({
          minerals: profile?.minerals || 0,
          stamina: profile?.stamina || 0,
          lastAdRechargeTime: profile?.last_ad_stamina_recharge || null,
          inventory: formatInventory(rawInventory),
        });

        // 스태미나 갱신 및 회복 체크
        if (profile?.stamina !== undefined && profile.stamina < 5) {
          get().checkStamina();
        }
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
      const authRes = await safeSupabaseQuery(supabase.auth.getUser());
      const user = authRes?.data?.user;
      if (!user) return;

      let { data, error } = await safeSupabaseQuery(
        supabase.rpc('check_and_recover_stamina', { p_user_id: user.id })
      );

      if (error && (error as any).code === 'PGRST202') {
        const fallbackRes = await safeSupabaseQuery(supabase.rpc('check_and_recover_stamina'));
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

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
      if (get().isAdLoading) {
        console.warn('[useUserStore] recoverStaminaAds ignored: Ad is already loading');
        return { success: false, message: '이미 광고를 호출 중입니다.' };
      }
      set({ isAdLoading: true });

      try {
        const adResult = await AdService.showRewardedAd('stamina_recharge');
        if (!adResult.success) {
          return { success: false, message: adResult.error || '광고 시청에 실패했습니다.' };
        }

        const { data: authData } = await safeSupabaseQuery(supabase.auth.getUser());
        const userId = authData?.user?.id;

        let res = await callRpcAndRefresh<{
          success: boolean;
          stamina: number;
          last_ad_stamina_recharge: string;
        }>(
          supabase.rpc(
            'secure_reward_ad_view',
            userId
              ? { p_ad_type: 'stamina_recharge', p_user_id: userId }
              : { p_ad_type: 'stamina_recharge' }
          ),
          {
            refreshData: true,
          }
        );

        // PGRST202 (함수 시그니처 미존재 404) 발생 시 p_user_id 제외하고 2차 시도
        if (!res.success && (res as any).errorCode === 'PGRST202') {
          console.warn(
            '[useUserStore] PGRST202 fallback: calling secure_reward_ad_view without p_user_id'
          );
          res = await callRpcAndRefresh<{
            success: boolean;
            stamina: number;
            last_ad_stamina_recharge: string;
          }>(supabase.rpc('secure_reward_ad_view', { p_ad_type: 'stamina_recharge' }), {
            refreshData: true,
          });
        }

        return res as { success: boolean; message: string };
      } finally {
        set({ isAdLoading: false });
      }
    },

    recoverMineralsAds: async () => {
      if (get().isAdLoading) {
        console.warn('[useUserStore] recoverMineralsAds ignored: Ad is already loading');
        return { success: false, message: '이미 광고를 호출 중입니다.' };
      }
      set({ isAdLoading: true });

      try {
        const adResult = await AdService.showRewardedAd('mineral_recharge');
        if (!adResult.success) return { success: false, message: UI_MESSAGES.AD_WATCH_FAILED() };

        const { data: authData } = await safeSupabaseQuery(supabase.auth.getUser());
        const userId = authData?.user?.id;

        let res = await callRpcAndRefresh<{ success: boolean; minerals: number }>(
          supabase.rpc(
            'secure_reward_ad_view',
            userId
              ? { p_ad_type: 'mineral_recharge', p_user_id: userId }
              : { p_ad_type: 'mineral_recharge' }
          ),
          { refreshData: true }
        );

        if (!res.success && (res as any).errorCode === 'PGRST202') {
          console.warn(
            '[useUserStore] PGRST202 fallback: calling secure_reward_ad_view without p_user_id'
          );
          res = await callRpcAndRefresh<{ success: boolean; minerals: number }>(
            supabase.rpc('secure_reward_ad_view', { p_ad_type: 'mineral_recharge' }),
            { refreshData: true }
          );
        }

        return res;
      } finally {
        set({ isAdLoading: false });
      }
    },

    rewardMinerals: async (amount: number, isBonus?: boolean) => {
      if (amount <= 0) return { success: false, message: 'Invalid amount' };

      if (isBonus) {
        const { data: authData } = await safeSupabaseQuery(supabase.auth.getUser());
        const userId = authData?.user?.id;

        let res = await callRpcAndRefresh<{ success: boolean; minerals: number }>(
          supabase.rpc(
            'secure_reward_ad_view',
            userId
              ? { p_ad_type: 'double_reward', p_user_id: userId }
              : { p_ad_type: 'double_reward' }
          ),
          { refreshData: true }
        );

        if (!res.success && (res as any).errorCode === 'PGRST202') {
          console.warn(
            '[useUserStore] PGRST202 fallback: calling secure_reward_ad_view without p_user_id'
          );
          res = await callRpcAndRefresh<{ success: boolean; minerals: number }>(
            supabase.rpc('secure_reward_ad_view', { p_ad_type: 'double_reward' }),
            { refreshData: true }
          );
        }

        return res;
      }

      // [Security Warning] Generic mineral rewards without ads or game clear are discouraged.
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
      const newStamina = Math.max(0, amount);
      set({ stamina: newStamina });

      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_set_stamina', { p_stamina: amount }),
          CommonResponseSchema,
          'debug_set_stamina'
        ),
        { refreshData: true }
      );
      if (res.success) set({ stamina: newStamina });
    },

    debugSetMinerals: async (amount: number) => {
      const newMinerals = Math.max(0, amount);
      set({ minerals: newMinerals });

      const res = await callRpcAndRefresh(
        validatedRpc(
          supabase.rpc('debug_set_minerals', { p_minerals: amount }),
          CommonResponseSchema,
          'debug_set_minerals'
        ),
        { refreshData: true }
      );
      if (res.success) set({ minerals: newMinerals });
    },

    refundStamina: async () => {
      // [Security Policy] Stamina refund is now strictly server-side.
      // This function will be replaced by a secure RPC call in a future update if required.
      // Currently, stamina is only consumed upon successful game start.
      return { success: false, message: '보안 정책에 따라 직접적인 스태미나 수정이 제한됩니다.' };
    },
  };
});
