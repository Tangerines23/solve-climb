import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { validatedRpc, CommonResponseSchema } from '@/utils/rpcValidator';
import { UserRepository } from '@/services/UserRepository';
import { useUserStore } from '@/stores/useUserStore';

/**
 * 디버그 전용 유저 재화, 스태미나 및 인벤토리 조작 서비스 (DebugUserService)
 * - 프로덕션 useUserStore에서 분리되어 디버그 전용 RPC들을 캡슐화합니다.
 */
class DebugUserService {
  private static async callRpcAndRefresh<T extends { success: boolean; message?: string }>(
    rpcCall: PromiseLike<{ data: T | null; error: unknown }>,
    options: { errorMessage?: string } = {}
  ): Promise<{ success: boolean; message: string } & Partial<T>> {
    const res = await UserRepository.callRpc<T>(rpcCall, options);
    if (res.success) {
      await useUserStore.getState().fetchUserData();
    }
    return res;
  }

  static async debugAddItems(): Promise<void> {
    const res = await this.callRpcAndRefresh(supabase.rpc('debug_grant_items'));
    if (res.success) console.log('[DEBUG] Items Added');
  }

  static async debugResetItems(): Promise<void> {
    const sessionRes = await safeSupabaseQuery(supabase.auth.getSession());
    const session = (sessionRes as { data?: { session?: { user?: { id?: string } } } })?.data
      ?.session;
    const userId = session?.user?.id || 'anonymous-debug-user';

    const res = await this.callRpcAndRefresh(
      validatedRpc(
        supabase.rpc('debug_reset_inventory', { p_user_id: userId }),
        CommonResponseSchema,
        'debug_reset_inventory'
      )
    );
    if (res.success) console.log('[DEBUG] Inventory Reset');
  }

  static async debugRemoveItems(): Promise<void> {
    const userRes = await safeSupabaseQuery(supabase.auth.getUser());
    const user = (userRes as { data?: { user?: { id?: string } } })?.data?.user;
    const userId = user?.id || 'anonymous-debug-user';

    const inventoryRes = await safeSupabaseQuery(
      supabase.from('inventory').select('item_id, quantity').eq('user_id', userId)
    );
    const inventory = (inventoryRes as { data?: Array<{ item_id: number; quantity: number }> })
      ?.data;
    if (!Array.isArray(inventory) || inventory.length === 0) return;

    await Promise.all(
      inventory.map((item) =>
        this.callRpcAndRefresh(
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
    await useUserStore.getState().fetchUserData();
  }

  static async debugSetStamina(amount: number): Promise<void> {
    const newStamina = Math.max(0, Number.isFinite(amount) ? Math.floor(amount) : 0);
    useUserStore.setState({ stamina: newStamina });

    const res = await this.callRpcAndRefresh(
      validatedRpc(
        supabase.rpc('debug_set_stamina', { p_stamina: newStamina }),
        CommonResponseSchema,
        'debug_set_stamina'
      )
    );
    if (res.success) {
      useUserStore.setState({ stamina: newStamina });
    }
  }

  static async debugSetMinerals(amount: number): Promise<void> {
    const newMinerals = Math.max(0, Number.isFinite(amount) ? Math.floor(amount) : 0);
    useUserStore.setState({ minerals: newMinerals });

    const res = await this.callRpcAndRefresh(
      validatedRpc(
        supabase.rpc('debug_set_minerals', { p_minerals: newMinerals }),
        CommonResponseSchema,
        'debug_set_minerals'
      )
    );
    if (res.success) {
      useUserStore.setState({ minerals: newMinerals });
    }
  }
}

export const debugUserService = DebugUserService;
