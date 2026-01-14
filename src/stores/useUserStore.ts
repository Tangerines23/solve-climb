import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('[UserStore] No user found, skipping fetch');
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('minerals, stamina')
        .eq('id', user.id)
        .single();

      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select(
          `
                    quantity,
                    items (id, code, name, description)
                `
        )
        .eq('user_id', user.id);

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
        inventory: formattedInventory,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  purchaseItem: async (itemId: number) => {
    const { data, error } = await supabase.rpc('purchase_item', { p_item_id: itemId });
    if (error) throw error;

    if (data.success) {
      await get().fetchUserData(); // Refresh data
    }
    return data;
  },

  checkStamina: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase.rpc('check_and_recover_stamina');
    if (error) {
      console.error('Error checking stamina:', error);
      return;
    }
    if (data && typeof data.stamina === 'number') {
      set({ stamina: data.stamina });
    }
  },

  consumeItem: async (itemId: number) => {
    const { data, error } = await supabase.rpc('consume_item', { p_item_id: itemId });
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

    const { data, error } = await supabase.rpc('consume_stamina');
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ minerals: value }).eq('id', user.id);
      }
    } catch (error) {
      console.error('Error syncing debug minerals:', error);
    }
  },

  setStamina: async (stamina: number) => {
    const value = Math.max(0, stamina);
    set({ stamina: value });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ stamina: value, last_stamina_update: new Date().toISOString() })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error syncing debug stamina:', error);
    }
  },

  recoverStaminaAds: async () => {
    const { data, error } = await supabase.rpc('recover_stamina_ads');
    if (error) {
      console.error('Error recovering stamina (ads):', error);
      return { success: false, message: '오류가 발생했습니다.' };
    }

    if (data.success) {
      set((state) => ({ stamina: Math.min(5, state.stamina + 1) }));
    }
    return data;
  },

  // DEV ONLY: 아이템 지급 치트 (RPC Version)
  debugAddItems: async () => {
    console.log('[DEBUG] Calling debug_grant_items RPC...');
    const { error } = await supabase.rpc('debug_grant_items');

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    console.log('[DEBUG] Resetting items...');
    const { error } = await supabase.from('inventory').delete().eq('user_id', user.id);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get current inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', user.id);
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
      await supabase.from('inventory').delete().in('item_id', deletions);
    }

    if (updates.length > 0) {
      await supabase.from('inventory').upsert(updates);
    }

    await get().fetchUserData();
  },

  refundStamina: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    // Simply increment stamina locally and sync to server
    // Note: server should ideally have a refund RPC, but for now we manually update
    // Or reusing recover_stamina logic if appropriate, but refund implies giving back what was taken.
    // Let's increment by 1 safely.

    // Optimistic update
    set((state) => ({ stamina: Math.min(5, state.stamina + 1) }));

    try {
      const { error } = await supabase.rpc('recover_stamina_ads'); // Using existing recovery RPC as it increments by 1
      if (error) throw error;
      return { success: true, message: 'Stamina refunded' };
    } catch (error) {
      console.error('Error refunding stamina:', error);
      return { success: false, message: 'Failed to refund stamina' };
    }
  },
}));
