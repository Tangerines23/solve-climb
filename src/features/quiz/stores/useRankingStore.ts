import { create } from 'zustand';
import { supabase } from '@/utils/supabaseClient';
import { useToastStore } from '@/stores/useToastStore';
import { UI_MESSAGES } from '@/constants/ui';
import { STATUS } from '@/constants/status';
import { validatedRpc, RankingListSchema } from '@/utils/rpcValidator';
import type { RankingRecord } from '../types/progress';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RankingState {
  rankings: { [key: string]: RankingRecord[] };
  rankingVersion: number;
  _rankingSubscription: RealtimeChannel | null;

  fetchRanking: (
    world: string | null,
    category: string | null,
    period: 'weekly' | 'all-time',
    type: 'total' | 'time-attack' | 'survival' | 'infinite',
    limit?: number
  ) => Promise<void>;
  subscribeToRankingUpdates: () => void;
  unsubscribeFromRankingUpdates: () => void;
}

export const useRankingStore = create<RankingState>((set, get) => ({
  rankings: {},
  rankingVersion: 0,
  _rankingSubscription: null,

  fetchRanking: async (world, category, period, type, limit = 50) => {
    try {
      let data: RankingRecord[] | null = null;
      let error: unknown = null;

      if (period === 'all-time') {
        const { data: hofData, error: hofError } = await supabase
          .from('hall_of_fame')
          .select('user_id, nickname, score, rank, week_start_date, tier_level, tier_stars')
          .eq('mode', type)
          .order('week_start_date', { ascending: false })
          .order('rank', { ascending: true })
          .limit(limit);
        data = hofData;
        error = hofError;
      } else {
        const { data: rankData, error: rankError } = await validatedRpc(
          supabase.rpc('get_ranking_v2', {
            p_category: category || 'all',
            p_limit: limit,
            p_period: period,
            p_type: type,
          }),
          RankingListSchema,
          'get_ranking_v2'
        );
        data = rankData;
        error = rankError;
      }

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const key =
          world && category ? `${world}-${category}-${period}-${type}` : `${period}-${type}`;
        set((state) => ({
          rankings: {
            ...state.rankings,
            [key]: data!,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
      useToastStore.getState().showToast(UI_MESSAGES.RANKING_FETCH_FAILED, STATUS.ERROR);
    }
  },

  subscribeToRankingUpdates: () => {
    const state = get();
    if (state._rankingSubscription) return;

    const channel = supabase
      .channel('ranking-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'weekly_score_total=gt.0' },
        () => {
          set((state) => ({ rankingVersion: state.rankingVersion + 1 }));
        }
      )
      .subscribe();

    set({ _rankingSubscription: channel });
  },

  unsubscribeFromRankingUpdates: () => {
    const state = get();
    if (state._rankingSubscription) {
      state._rankingSubscription.unsubscribe();
      set({ _rankingSubscription: null });
    }
  },
}));
