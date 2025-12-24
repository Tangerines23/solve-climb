import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

interface UserState {
    minerals: number;
    stamina: number;
    inventory: Array<{ id: number; code: string; name: string; description: string; quantity: number }>;
    isLoading: boolean;

    fetchUserData: () => Promise<void>;
    purchaseItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
    checkStamina: () => Promise<void>;
    consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
    consumeStamina: () => Promise<{ success: boolean; message: string }>;
    setMinerals: (minerals: number) => Promise<void>;
    setStamina: (stamina: number) => void;
    recoverStaminaAds: () => Promise<{ success: boolean; message: string }>;

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
    lastStaminaConsumeTime: 0,

    fetchUserData: async () => {
        set({ isLoading: true });
        try {
            const { data: { user } } = await supabase.auth.getUser();
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
                .select(`
                    quantity,
                    items (id, code, name, description)
                `)
                .eq('user_id', user.id);

            const formattedInventory = inventoryData?.map((item: any) => ({
                id: item.items.id,
                code: item.items.code,
                name: item.items.name,
                description: item.items.description,
                quantity: item.quantity
            })) || [];

            set({
                minerals: profile?.minerals || 0,
                stamina: profile?.stamina || 0,
                inventory: formattedInventory
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
        const { data: { session } } = await supabase.auth.getSession();
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
                lastStaminaConsumeTime: now
            }));
        }
        return data;
    },

    setMinerals: async (minerals: number) => {
        const value = Math.max(0, minerals);
        set({ minerals: value });

        try {
            const { data: { user } } = await supabase.auth.getUser();
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
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({ stamina: value, last_stamina_update: new Date().toISOString() }).eq('id', user.id);
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
            alert(`아이템 지급 실패: ${error.message}\n(SQL 권한 문제일 수 있습니다)`);
            return;
        }

        console.log('[DEBUG] RPC Success');
        // alert handled in UI (Header)
        await get().fetchUserData();
    },

    // DEV ONLY: 아이템 초기화
    debugResetItems: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('[DEBUG] Resetting items...');
        const { error } = await supabase.from('inventory').delete().eq('user_id', user.id);

        if (error) {
            console.error('[DEBUG] Reset Failed:', error);
            alert(`초기화 실패: ${error.message}`);
            return;
        }

        console.log('[DEBUG] Items Reset Success');
        await get().fetchUserData();
    },

    // DEV ONLY: 아이템 5개씩 감소
    debugRemoveItems: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current inventory
        const { data: inventory } = await supabase.from('inventory').select('id, quantity').eq('user_id', user.id);
        if (!inventory) return;

        const updates: any[] = [];
        const deletions: any[] = [];

        for (const item of inventory) {
            const newQty = item.quantity - 5;
            if (newQty <= 0) {
                deletions.push(item.id);
            } else {
                updates.push({ id: item.id, quantity: newQty, user_id: user.id });
            }
        }

        if (deletions.length > 0) {
            await supabase.from('inventory').delete().in('id', deletions);
        }

        if (updates.length > 0) {
            await supabase.from('inventory').upsert(updates);
        }

        await get().fetchUserData();
    },
}));
