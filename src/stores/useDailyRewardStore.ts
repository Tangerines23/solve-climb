import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { useUserStore } from './useUserStore';

interface DailyRewardResult {
  success: boolean;
  reward_minerals?: number;
  streak?: number;
  message: string;
}

interface DailyRewardState {
  rewardResult: DailyRewardResult | null;
  isLoading: boolean;
  showModal: boolean;

  checkDailyLogin: () => Promise<void>;
  closeModal: () => void;
}

export const useDailyRewardStore = create<DailyRewardState>((set) => ({
  rewardResult: null,
  isLoading: false,
  showModal: false,

  checkDailyLogin: async () => {
    set({ isLoading: true });
    try {
      // 1. 유저 정보 확인
      const authRes = await safeSupabaseQuery(supabase.auth.getUser());
      const user = authRes?.data?.user;
      if (!user) {
        set({ isLoading: false });
        return;
      }

      // 2. RPC 호출 (p_user_id 1차 호출 -> PGRST202 시 하위호환 fallback)
      let { data, error } = await safeSupabaseQuery(
        supabase.rpc('handle_daily_login', { p_user_id: user.id })
      );

      if (error && (error as any).code === 'PGRST202') {
        console.warn(
          '[useDailyRewardStore] PGRST202 fallback: calling handle_daily_login() without args'
        );
        const fallbackRes = await safeSupabaseQuery(supabase.rpc('handle_daily_login'));
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        console.error('[useDailyRewardStore] RPC Error:', error);
        set({ isLoading: false });
        return;
      }

      const result = data as DailyRewardResult;

      // 3. 성공한 경우에만 모달 표시 (오늘 이미 받았으면 success: false)
      if (result && result.success) {
        // 출석 보상 지급에 따른 미네랄 동기화
        useUserStore.getState().fetchUserData();

        set({
          rewardResult: result,
          showModal: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('[useDailyRewardStore] Unexpected Error:', e);
      set({ isLoading: false });
    }
  },

  closeModal: () => {
    set({ showModal: false, rewardResult: null });
  },
}));
