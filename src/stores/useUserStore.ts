import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { debugSupabaseQuery } from '../utils/debugFetch';
import { PostgrestError } from '@supabase/supabase-js';
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

  lastStaminaConsumeTime: number;
}

export const useUserStore = create<UserState>((set, get) => ({
  minerals: 0,
  stamina: 5,
  inventory: [],
  isLoading: false,
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
      const authResult = await debugSupabaseQuery(supabase.auth.getUser());
      const user = authResult?.data?.user;
      if (!user) {
        console.log('[UserStore] No user found, skipping fetch');
        return;
      }

      // Fetch profile
      const { data: profile } = await debugSupabaseQuery(
        supabase
          .from('profiles')
          .select('minerals, stamina, last_ad_stamina_recharge')
          .eq('id', user.id)
          .single()
      );

      // Fetch inventory
      const { data: inventoryData } = await debugSupabaseQuery(
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
          id: item.items.id,
          code: item.items.code,
          name: item.items.name,
          description: item.items.description,
          quantity: item.quantity,
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
    const { data, error } = await debugSupabaseQuery(
      supabase.rpc('purchase_item', { p_item_id: itemId })
    );
    if (error) throw error;

    if (data.success) {
      await get().fetchUserData(); // Refresh data
    }
    return data;
  },

  checkStamina: async () => {
    const {
      data: { session },
    } = await debugSupabaseQuery(supabase.auth.getSession());
    if (!session?.user) return;

    const { data, error } = await debugSupabaseQuery(supabase.rpc('check_and_recover_stamina'));
    if (error) {
      console.error('Error checking stamina:', error);
      return;
    }
    if (data && typeof data.stamina === 'number') {
      set({ stamina: data.stamina });
    }
  },

  consumeItem: async (itemId: number) => {
    const { data, error } = await debugSupabaseQuery(
      supabase.rpc('consume_item', { p_item_id: itemId })
    );
    if (error) throw error;

    if (data.success) {
      await get().fetchUserData();
    }
    return data;
  },

  consumeStamina: async () => {
    const now = Date.now();
    const lastTime = get().lastStaminaConsumeTime;

    if (now - lastTime < 3000) {
      console.log('[UserStore] Stamina consumption throttled');
      return { success: true, message: 'Already consumed' };
    }

    const { data, error } = await debugSupabaseQuery(supabase.rpc('consume_stamina'));
    if (error) {
      console.error('Error consuming stamina:', error);
      return { success: false, message: '오류가 발생했습니다.' };
    }

    if (data.success) {
      set((state) => ({
        stamina: Math.max(0, state.stamina - 1),
        lastStaminaConsumeTime: now,
      }));
    }
    return data;
  },

  setMinerals: async (minerals: number) => {
    const value = Math.max(0, minerals);
    set({ minerals: value });

    try {
      const authResult = await debugSupabaseQuery(supabase.auth.getUser());
      const user = authResult?.data?.user;
      if (user) {
        await debugSupabaseQuery(
          supabase.from('profiles').update({ minerals: value }).eq('id', user.id)
        );
      }
    } catch (error) {
      console.error('Error syncing debug minerals:', error);
    }
  },

  setStamina: async (stamina: number) => {
    const value = Math.max(0, stamina);
    set({ stamina: value });

    try {
      const authResult = await debugSupabaseQuery(supabase.auth.getUser());
      const user = authResult?.data?.user;
      if (user) {
        await debugSupabaseQuery(
          supabase
            .from('profiles')
            .update({ stamina: value, last_stamina_update: new Date().toISOString() })
            .eq('id', user.id)
        );
      }
    } catch (error) {
      console.error('Error syncing debug stamina:', error);
    }
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
    const { data, error } = await debugSupabaseQuery(supabase.rpc('recover_stamina_ads'));

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

    if (data.success) {
      // 서버 응답 성공 시 로컬 상태 업데이트
      set({
        stamina: data.stamina || 5,
        lastAdRechargeTime: new Date().toISOString(),
      });
    }
    return data;
  },

  recoverMineralsAds: async () => {
    // 1. 광고 시청 (AdService 위임)
    const adResult = await AdService.showRewardedAd('mineral_recharge');
    if (!adResult.success) {
      return { success: false, message: adResult.error || '광고 시청에 실패했습니다.' };
    }

    // 2. 보상 지급 (500💎)
    const amount = 500;
    const currentMinerals = get().minerals;
    await get().setMinerals(currentMinerals + amount);
    return { success: true, message: `${amount} 미네랄이 충전되었습니다! 💎` };
  },

  rewardMinerals: async (amount: number, isBonus = false) => {
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    // 보너스(2배) 성격일 경우 광고 시청 확인 (선택 사항: 호출부에서 할 수도 있음)
    // 여기서는 범용 보상 함수이므로 보상 지급만 담당하도록 유지하고,
    // 광고 시언은 호출부(ResultPage)에서 AdService를 직접 부르는 것이 더 유연함

    const currentMinerals = get().minerals;
    await get().setMinerals(currentMinerals + amount);
    return {
      success: true,
      message: isBonus ? `${amount} 보너스 미네랄 획득! 💎` : `${amount} 미네랄 획득! 💎`,
    };
  },

  // DEV ONLY: 아이템 지급 치트 (RPC Version)
  debugAddItems: async () => {
    console.log('[DEBUG] Calling debug_grant_items RPC...');
    const { error } = await debugSupabaseQuery(supabase.rpc('debug_grant_items'));

    if (error) {
      console.error('[DEBUG] RPC Failed:', error);
      // alert replaced with console error. Caller components should handle UI feedback.
      return;
    }

    console.log('[DEBUG] RPC Success');
    // alert handled in UI (Header)
    await get().fetchUserData();
  },

  // DEV ONLY: 아이템 초기화
  debugResetItems: async () => {
    const authResult = await debugSupabaseQuery(supabase.auth.getUser());
    const user = authResult?.data?.user;
    if (!user) return;

    console.log('[DEBUG] Resetting items...');
    const { error } = await debugSupabaseQuery(
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
    const authResult = await debugSupabaseQuery(supabase.auth.getUser());
    const user = authResult?.data?.user;
    if (!user) return;

    // Get current inventory
    const { data: inventory } = await debugSupabaseQuery(
      supabase.from('inventory').select('id, quantity').eq('user_id', user.id)
    );
    if (!inventory) return;

    const updates: Array<{ id: number; quantity: number }> = [];
    const deletions: number[] = [];

    for (const item of inventory) {
      const newQty = item.quantity - 5;
      if (newQty <= 0) {
        deletions.push(item.id);
      } else {
        updates.push({ id: item.id, quantity: newQty });
      }
    }

    if (deletions.length > 0) {
      await debugSupabaseQuery(supabase.from('inventory').delete().in('item_id', deletions));
    }

    if (updates.length > 0) {
      await debugSupabaseQuery(supabase.from('inventory').upsert(updates));
    }

    await get().fetchUserData();
  },

  refundStamina: async () => {
    const authResult = await debugSupabaseQuery(supabase.auth.getUser());
    const user = authResult?.data?.user;
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    // Optimistic update
    const currentStamina = get().stamina;
    if (currentStamina < 5) {
      set({ stamina: currentStamina + 1 });
    }

    try {
      const { error } = (await debugSupabaseQuery(supabase.rpc('recover_stamina_ads'))) || {};
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
