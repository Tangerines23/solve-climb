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
    const {
      data: { session },
    } = await safeSupabaseQuery(supabase.auth.getSession());
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
    const newStamina = Math.max(0, amount);
    useUserStore.setState({ stamina: newStamina });

    const res = await this.callRpcAndRefresh(
      validatedRpc(
        supabase.rpc('debug_set_stamina', { p_stamina: amount }),
        CommonResponseSchema,
        'debug_set_stamina'
      )
    );
    if (res.success) {
      useUserStore.setState({ stamina: newStamina });
    }
  }

  static async debugSetMinerals(amount: number): Promise<void> {
    const newMinerals = Math.max(0, amount);
    useUserStore.setState({ minerals: newMinerals });

    const res = await this.callRpcAndRefresh(
      validatedRpc(
        supabase.rpc('debug_set_minerals', { p_minerals: amount }),
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
