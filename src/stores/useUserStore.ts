import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient'; // Assuming this exists based on project context

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
}

export const useUserStore = create<UserState>((set, get) => ({
    minerals: 0,
    stamina: 5,
    inventory: [],
    isLoading: false,

    fetchUserData: async () => {
        set({ isLoading: true });
        try {
            // Wait for auth to be ready
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
        const { data, error } = await supabase.rpc('check_and_recover_stamina');
        if (error) {
            console.error('Error checking stamina:', error);
            return;
        }
        set({ stamina: data.stamina });
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
        const { data, error } = await supabase.rpc('consume_stamina');
        if (error) {
            console.error('Error consuming stamina:', error);
            return { success: false, message: '오류가 발생했습니다.' };
        }

        if (data.success) {
            // Optimistic update
            set((state) => ({ stamina: Math.max(0, state.stamina - 1) }));
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
    }
}));
