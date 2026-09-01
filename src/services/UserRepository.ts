import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { UI_MESSAGES } from '@/constants/ui';
import { InventoryItem } from '@/types/user';

export interface RawInventoryItem {
  quantity: number;
  items: {
    id: number;
    code: string;
    name: string;
    description: string;
  } | null;
}

export interface UserProfileResponse {
  minerals?: number;
  stamina?: number;
  is_anonymous?: boolean;
  last_ad_stamina_recharge?: string | null;
  updated_at?: string;
}

/**
 * 유저 재화 및 프로필 데이터베이스 저장소 (UserRepository)
 * - Supabase profiles 및 inventory 쿼리와 RPC 통신을 전담합니다.
 * - useUserStore 스토어에서 직접 DB 조회를 제거하고 로직을 캡슐화합니다.
 */
export class UserRepository {
  /**
   * 공통 RPC 실행기
   */
  static async callRpc<T extends { success: boolean; message?: string }>(
    rpcCall: PromiseLike<{ data: T | null; error: unknown }>,
    options: { errorMessage?: string } = {}
  ): Promise<{ success: boolean; message: string; errorCode?: string } & Partial<T>> {
    try {
      const { data, error } = await safeSupabaseQuery(rpcCall, {
        context: 'UserRepository.callRpc',
      });

      if (error) {
        console.error(`[UserRepository RPC Error]`, error);
        const errorCode =
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code: unknown }).code)
            : undefined;
        return {
          success: false,
          errorCode,
          message: options.errorMessage || UI_MESSAGES.COMMON_ERROR,
        } as { success: false; message: string; errorCode?: string } & Partial<T>;
      }

      if (!data || !data.success) {
        const errorMsg =
          (data as { error?: string })?.error ||
          data?.message ||
          options.errorMessage ||
          '요청 처리에 실패했습니다.';
        return {
          ...(data as Partial<T>),
          success: false,
          error: (data as { error?: string })?.error,
          message: errorMsg,
        } as { success: false; message: string; error?: string } & Partial<T>;
      }

      return {
        ...(data as T),
        success: true,
        message: data.message || '성공',
      };
    } catch (err) {
      console.error(`[UserRepository Unexpected Error]`, err);
      return {
        success: false,
        message: UI_MESSAGES.COMMON_ERROR,
      } as { success: false; message: string } & Partial<T>;
    }
  }

  /**
   * 유저 프로필 및 인벤토리 데이터를 통합 조회합니다.
   */
  static async fetchUserData(userId: string) {
    const [profileRes, inventoryRes] = await Promise.all([
      safeSupabaseQuery(
        supabase
          .from('profiles')
          .select('minerals, stamina, updated_at')
          .eq('id', userId)
          .maybeSingle(),
        {
          context: 'UserRepository.fetchUserData.profile',
        }
      ) as Promise<{ data: UserProfileResponse | null; error: unknown }>,
      safeSupabaseQuery(
        supabase
          .from('inventory')
          .select(
            `
            quantity,
            items (
              id,
              code,
              name,
              description
            )
          `
          )
          .eq('user_id', userId),
        { context: 'UserRepository.fetchUserData.inventory' }
      ) as Promise<{ data: RawInventoryItem[] | null; error: unknown }>,
    ]);

    return {
      profile: profileRes.data,
      profileError: profileRes.error,
      inventory: inventoryRes.data,
      inventoryError: inventoryRes.error,
    };
  }

  /**
   * 원시 인벤토리 데이터를 클라이언트 표준 규격으로 포맷팅
   */
  static formatInventory(raw: RawInventoryItem[] | null): InventoryItem[] {
    return (
      raw?.map((item) => ({
        id: item?.items?.id || 0,
        code: item?.items?.code || '',
        name: item?.items?.name || '',
        description: item?.items?.description || '',
        quantity: item?.quantity || 0,
      })) || []
    );
  }

  /**
   * 전설 달성 후 다음 사이클로 승급합니다.
   */
  static async promoteToNextCycle(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    return this.callRpc<{ success: boolean; message?: string; error?: string }>(
      supabase.rpc('promote_to_next_cycle'),
      { errorMessage: '승급 처리 중 오류가 발생했습니다.' }
    );
  }
}
