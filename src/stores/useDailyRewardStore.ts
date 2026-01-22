import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { debugSupabaseQuery } from '../utils/debugFetch';

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
      // 1. 세션 확인
      const {
        data: { session },
      } = await debugSupabaseQuery(supabase.auth.getSession());
      if (!session) {
        set({ isLoading: false });
        return;
      }

      // 2. RPC 호출
      const { data, error } = await debugSupabaseQuery(supabase.rpc('handle_daily_login'));

      if (error) {
        console.error('[useDailyRewardStore] RPC Error:', error);
        set({ isLoading: false });
        return;
      }

      const result = data as DailyRewardResult;

      // 3. 성공한 경우에만 모달 표시 (오늘 이미 받았으면 success: false)
      if (result && result.success) {
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
