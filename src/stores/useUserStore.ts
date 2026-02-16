import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import {
  validatedRpc,
  ItemActionResponseSchema,
  CommonResponseSchema,
} from '../utils/rpcValidator';
import { PostgrestError, UserResponse } from '@supabase/supabase-js';
import { AdService } from '../utils/adService';

interface UserState {
  minerals: number;
  stamina: number;
  inventory: Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    quantity: number;
  }>;
  isLoading: boolean;
  isAnonymous: boolean;
  lastAdRechargeTime: string | null;

  handleWatchAd: () => void;
  // Pause System
  showPauseModal: boolean;
  remainingPauses: number;
  handlePauseClick: () => void;
  handlePauseResume: () => void;
  handlePauseExit: () => void;

  fetchUserData: () => Promise<void>;
  purchaseItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  checkStamina: () => Promise<void>;
  consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  consumeStamina: () => Promise<{ success: boolean; message: string }>;
  setMinerals: (minerals: number) => Promise<void>;
  setStamina: (stamina: number) => void;
  recoverStaminaAds: () => Promise<{ success: boolean; message: string }>;
  recoverMineralsAds: () => Promise<{ success: boolean; message: string }>;
  rewardMinerals: (
    amount: number,
    isBonus?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  refundStamina: () => Promise<{ success: boolean; message: string }>;

  // DEV ONLY
  debugAddItems: () => Promise<void>;
  debugResetItems: () => Promise<void>;
  debugRemoveItems: () => Promise<void>;
  debugSetStamina: (amount: number) => Promise<void>;
  debugSetMinerals: (amount: number) => Promise<void>;

  lastStaminaConsumeTime: number;
}

export const useUserStore = create<UserState>((set, get) => ({
  minerals: 0,
  stamina: 5,
  inventory: [],
  isLoading: false,
  isAnonymous: false,
  lastAdRechargeTime: null,

  handleWatchAd: () => {
    console.log('Watch Ad called (not implemented)');
    // Implement ad watching logic here
  },
  showPauseModal: false,
  remainingPauses: 3, // Initial value
  handlePauseClick: () => {
    set(() => ({ showPauseModal: true }));
  },
  handlePauseResume: () => {
    set(() => ({ showPauseModal: false }));
  },
  handlePauseExit: () => {
    set(() => ({ showPauseModal: false }));
    // Additional logic for exiting the quiz/game
  },

  lastStaminaConsumeTime: 0,

  fetchUserData: async () => {
    set({ isLoading: true });
    try {
      const authResult = await safeSupabaseQuery(supabase.auth.getUser());
      const user = authResult?.data?.user;
      if (!user) {
        console.log('[UserStore] No user found, skipping fetch');
        return;
      }

      set({ isAnonymous: !!user.is_anonymous });

      // Fetch profile
      const { data: profile } = await safeSupabaseQuery(
        supabase
          .from('profiles')
          .select('minerals, stamina, last_ad_stamina_recharge')
          .eq('id', user.id)
          .maybeSingle()
      );

      // Fetch inventory
      const { data: inventoryData } = await safeSupabaseQuery(
        supabase
          .from('inventory')
          .select(
            `
                    quantity,
                    items (id, code, name, description)
                `
          )
          .eq('user_id', user.id)
      );

      type InventoryItem = {
        quantity: number;
        items: {
          id: number;
          code: string;
          name: string;
          description: string;
        };
      };
      const formattedInventory =
        (inventoryData as InventoryItem[] | null)?.map((item) => ({
          id: item?.items?.id,
          code: item?.items?.code,
          name: item?.items?.name,
          description: item?.items?.description,
          quantity: item?.quantity || 0,
        })) || [];

      set({
        minerals: profile?.minerals || 0,
        stamina: profile?.stamina || 0,
        lastAdRechargeTime: profile?.last_ad_stamina_recharge || null,
        inventory: formattedInventory,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  purchaseItem: async (itemId: number) => {
    const { data, error } = await validatedRpc(
      supabase.rpc('purchase_item', { p_item_id: itemId }),
      ItemActionResponseSchema,
      'purchase_item'
    );
    if (error) throw error;
    if (!data || !data.success) {
      return { success: false, message: data?.message || '구매 실패' };
    }

    if (data?.success) {
      await get().fetchUserData(); // Refresh data
    }
    return {
      success: true,
      message: data.message || '구매 성공',
      remaining_minerals: data.remaining_minerals,
      new_quantity: data.new_quantity,
    };
  },

  checkStamina: async () => {
    const {
      data: { session },
    } = await safeSupabaseQuery(supabase.auth.getSession());
    if (!session?.user) return;

    const { data, error } = await safeSupabaseQuery(supabase.rpc('check_and_recover_stamina'));
    if (error) {
      console.error('Error checking stamina:', error);
      return;
    }
    if (data && typeof data?.stamina === 'number') {
      set({ stamina: data.stamina });
    }
  },

  consumeItem: async (itemId: number) => {
    const { data, error } = await validatedRpc(
      supabase.rpc('consume_item', { p_item_id: itemId }),
      ItemActionResponseSchema,
      'consume_item'
    );
    if (error) throw error;
    if (!data || !data.success) {
      return { success: false, message: data?.message || '아이템 사용 실패' };
    }

    if (data?.success) {
      await get().fetchUserData();
    }
    return {
      success: true,
      message: data.message || '아이템 사용 성공',
      remaining_minerals: data.remaining_minerals,
      new_quantity: data.new_quantity,
    };
  },

  consumeStamina: async () => {
    const now = Date.now();
    const lastTime = get().lastStaminaConsumeTime;

    if (now - lastTime < 3000) {
      console.log('[UserStore] Stamina consumption throttled');
      return { success: true, message: 'Already consumed' };
    }

    const { data, error } = await safeSupabaseQuery(supabase.rpc('consume_stamina'));
    if (error) {
      console.error('Error consuming stamina:', error);
      return { success: false, message: '오류가 발생했습니다.' };
    }

    if (data?.success) {
      set((state) => ({
        stamina: Math.max(0, state.stamina - 1),
        lastStaminaConsumeTime: now,
      }));
    }
    return data || { success: false, message: 'Response failed' };
  },

  setMinerals: async (minerals: number) => {
    // [보안 지침] 직접적인 profiles update 정책이 폐쇄되었습니다.
    // 이 함수는 로컬 상태 업데이트용으로만 사용하고, 서버 동기화는 add_minerals RPC를 권장합니다.
    set({ minerals: Math.max(0, minerals) });
    console.warn(
      '[UserStore] Direct setMinerals sync is disabled for security. Use rewardMinerals instead.'
    );
  },

  setStamina: async (stamina: number) => {
    set({ stamina: Math.max(0, stamina) });
    console.warn(
      '[UserStore] Direct setStamina sync is disabled for security. Stamina recovery is handled server-side.'
    );
  },

  recoverStaminaAds: async () => {
    // 1. 클라이언트 레벨 쿨타임 체크 (UX 향상)
    const lastRecharge = get().lastAdRechargeTime;
    if (lastRecharge) {
      const lastTime = new Date(lastRecharge).getTime();
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;

      if (now - lastTime < sixHours) {
        const remainingMinutes = Math.ceil((sixHours - (now - lastTime)) / (60 * 1000));
        return {
          success: false,
          message: `아직 충전할 수 없습니다. (${remainingMinutes}분 남음)`,
        };
      }
    }

    // 2. 광고 시청 (AdService 위임)
    const adResult = await AdService.showRewardedAd('stamina_recharge');
    if (!adResult.success) {
      return { success: false, message: adResult.error || '광고 시청에 실패했습니다.' };
    }

    // 3. 서버 연동 (RPC 호출)
    const { data, error } = await safeSupabaseQuery(supabase.rpc('recover_stamina_ads'));

    // PGRST202: RPC 함수가 DB에 없을 경우 (마이그레이션 누락 시 시뮬레이션Fallback)
    if (error) {
      if ((error as PostgrestError).code === 'PGRST202') {
        console.warn('[UserStore] recover_stamina_ads RPC not found. Simulation fallback.');
        const nowIso = new Date().toISOString();
        await get().setStamina(5); // 풀 충전
        set({ lastAdRechargeTime: nowIso });
        return { success: true, message: '산소통이 전체 충전되었습니다! (시뮬레이션)' };
      }

      console.error('Error recovering stamina (ads):', error);
      return { success: false, message: '오류가 발생했습니다.' };
    }

    if (data?.success) {
      // 서버 응답 성공 시 로컬 상태 업데이트
      set({
        stamina: data.stamina || 5,
        lastAdRechargeTime: new Date().toISOString(),
      });
    }
    return data || { success: false, message: 'Response failed' };
  },

  recoverMineralsAds: async () => {
    // 1. 광고 시청
    const adResult = await AdService.showRewardedAd('mineral_recharge');
    if (!adResult.success) {
      return { success: false, message: adResult.error || '광고 시청에 실패했습니다.' };
    }

    // 2. 서버 연동 (SECURE RPC)
    const amount = 500;
    const { data, error } = await safeSupabaseQuery(
      supabase.rpc('add_minerals', { p_amount: amount })
    );

    if (error) {
      console.error('Error rewarding minerals via RPC:', error);
      return { success: false, message: '보상 지급 중 오류가 발생했습니다.' };
    }

    if (data.success) {
      set({ minerals: data.minerals });
      return { success: true, message: `${amount} 미네랄이 충전되었습니다! 💎` };
    }

    return { success: false, message: data.message };
  },

  rewardMinerals: async (amount: number, isBonus = false) => {
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    const { data, error } = await safeSupabaseQuery(
      supabase.rpc('add_minerals', { p_amount: amount })
    );

    if (error) {
      console.error('Error rewarding minerals via RPC:', error);
      return { success: false, message: '미네랄 지급 중 오류가 발생했습니다.' };
    }

    if (data.success) {
      set({ minerals: data.minerals });
      return {
        success: true,
        message: isBonus ? `${amount} 보너스 미네랄 획득! 💎` : `${amount} 미네랄 획득! 💎`,
      };
    }

    return { success: false, message: data.message };
  },

  // DEV ONLY: 아이템 지급 치트 (RPC Version)
  debugAddItems: async () => {
    console.log('[DEBUG] Calling debug_grant_items RPC...');
    const { error } = await safeSupabaseQuery(supabase.rpc('debug_grant_items'));

    if (error) {
      console.error('[DEBUG] RPC Failed:', error);
      // alert replaced with console error. Caller components should handle UI feedback.
      return;
    }

    console.log('[DEBUG] RPC Success');
    // alert handled in UI (Header)
    await get().fetchUserData();
  },

  debugResetItems: async () => {
    const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
    const user = authResult?.data?.user;
    if (!user) return;

    console.log('[DEBUG] Resetting items...');
    const { error } = await safeSupabaseQuery(
      supabase.from('inventory').delete().eq('user_id', user.id)
    );

    if (error) {
      console.error('[DEBUG] Reset Failed:', error);
      // alert replaced with console error.
      return;
    }

    console.log('[DEBUG] Items Reset Success');
    await get().fetchUserData();
  },

  // DEV ONLY: 아이템 5개씩 감소
  debugRemoveItems: async () => {
    const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
    const user = authResult?.data?.user;
    if (!user) return;

    // Get current inventory
    const { data: inventory } = await safeSupabaseQuery(
      supabase.from('inventory').select('item_id, quantity').eq('user_id', user.id)
    );
    if (!inventory) return;

    // 보안 RPC를 통해 루프를 돌며 개별 업데이트
    for (const item of inventory) {
      const newQty = Math.max(0, item.quantity - 5);
      await validatedRpc(
        supabase.rpc('debug_set_inventory_quantity', {
          p_user_id: user.id,
          p_item_id: item.item_id,
          p_quantity: newQty,
        }),
        CommonResponseSchema,
        'debug_set_inventory_quantity'
      );
    }

    await get().fetchUserData();
  },

  // DEV ONLY: 스태미나 강제 설정 (DB Sync)
  debugSetStamina: async (amount: number) => {
    const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
    const user = authResult?.data?.user;

    if (!user) {
      console.error('[DEBUG] debugSetStamina: No authenticated user found.');
      return;
    }

    const newStamina = Math.max(0, amount);

    // 보안 RPC를 통해 프로필 업데이트
    const { data, error } = await validatedRpc(
      supabase.rpc('debug_update_profile_stats', {
        p_user_id: user.id,
        p_stamina: newStamina,
      }),
      CommonResponseSchema,
      'debug_update_profile_stats'
    );

    if (error || !data?.success) {
      console.error('[DEBUG] Set Stamina Failed:', error || data?.message);
      return;
    }

    console.log('[DEBUG] Set Stamina Success via RPC. Updating local store.');
    set({ stamina: newStamina });
  },

  // DEV ONLY: 미네랄 강제 설정 (DB Sync)
  debugSetMinerals: async (amount: number) => {
    const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
    const user = authResult?.data?.user;
    if (!user) {
      console.error('[DEBUG] debugSetMinerals: No authenticated user found.');
      return;
    }

    const newMinerals = Math.max(0, amount);

    // 보안 RPC를 통해 프로필 업데이트
    const { data, error } = await validatedRpc(
      supabase.rpc('debug_update_profile_stats', {
        p_user_id: user.id,
        p_minerals: newMinerals,
      }),
      CommonResponseSchema,
      'debug_update_profile_stats'
    );

    if (error || !data?.success) {
      console.error('[DEBUG] Set Minerals Failed:', error || data?.message);
      return;
    }

    console.log('[DEBUG] Set Minerals Success via RPC. Updating local store.');
    set({ minerals: newMinerals });
  },

  refundStamina: async () => {
    const authResult = (await safeSupabaseQuery(supabase.auth.getUser())) as UserResponse;
    const user = authResult?.data?.user;
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    // Optimistic update
    const currentStamina = get().stamina;
    if (currentStamina < 5) {
      set({ stamina: currentStamina + 1 });
    }

    try {
      const { error } = (await safeSupabaseQuery(supabase.rpc('recover_stamina_ads'))) || {};
      if (error) {
        // RPC가 없는 경우 (PGRST202) 시뮬레이션 모드로 간주하고 성공 반환
        if ((error as PostgrestError).code === 'PGRST202') {
          console.warn(
            '[UserStore] recover_stamina_ads RPC not found during refund. Using simulation fallback.'
          );
          // 이미 위에서 set한 상태를 서버에 동기화
          if (currentStamina < 5) {
            await get().setStamina(currentStamina + 1);
          }
          return { success: true, message: 'Stamina refunded (Simulation)' };
        }
        throw error;
      }
      return { success: true, message: 'Stamina refunded' };
    } catch (error) {
      console.error('Error refunding stamina:', error);
      return { success: false, message: 'Failed to refund stamina' };
    }
  },
}));
