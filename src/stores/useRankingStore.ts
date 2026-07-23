import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { validatedRpc, RankingListSchema } from '../utils/rpcValidator';
import { useToastStore } from './useToastStore';
import { UI_MESSAGES } from '../constants/ui';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RankingRecord {
  user_id: string;
  nickname: string;
  score: number;
  rank: number;
  week_start_date?: string; // 명예의 전당용 (시즌 시작일)
  tier_level?: number; // 명예의 전당용 (박제된 티어 레벨)
  tier_stars?: number; // 명예의 전당용 (박제된 티어 별)
}

interface RankingState {
  rankings: { [key: string]: RankingRecord[] };
  rankingVersion: number; // For triggering re-renders on realtime updates
  _rankingSubscription: RealtimeChannel | null; // Internal subscription reference

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

export const useRankingStore = create<RankingState>((set, get) => {
  return {
    rankings: {},
    rankingVersion: 0,
    _rankingSubscription: null,

    fetchRanking: async (world, category, period, type, limit = 50) => {
      try {
        let data: RankingRecord[] | null = null;
        let error: unknown = null;

        if (period === 'all-time') {
          // 명예의 전당 조회 (hall_of_fame 테이블)
          const { data: hofData, error: hofError } = await safeSupabaseQuery(
            supabase
              .from('hall_of_fame')
              .select('user_id, nickname, score, rank, week_start_date, tier_level, tier_stars')
              .eq('mode', type)
              .order('week_start_date', { ascending: false }) // 최신 시즌부터 표시
              .order('rank', { ascending: true }) // 각 시즌별 1등부터 표시
              .limit(limit)
          );
          data = hofData;
          error = hofError;
        } else {
          // 주간 랭킹 조회 (V2 RPC 사용)
          const { data: rankData, error: rankError } = await validatedRpc(
            safeSupabaseQuery(
              supabase.rpc('get_ranking_v2', {
                p_category: category || 'all',
                p_limit: limit,
                p_period: period,
                p_type: type,
              })
            ),
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
              [key]: data,
            },
          }));
        }
      } catch (error) {
        console.error('Failed to fetch ranking:', error);
        useToastStore.getState().showToast(UI_MESSAGES.RANKING_FETCH_FAILED, 'error');
      }
    },

    subscribeToRankingUpdates: () => {
      const state = get();
      if (state._rankingSubscription) return;

      console.log('[useRankingStore] Subscribing to Realtime Ranking updates...');

      const channel = supabase
        .channel('ranking-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: 'weekly_score_total=gt.0',
          },
          (payload) => {
            console.log('[useRankingStore] Realtime event received:', payload);
            // Trigger re-render by incrementing version
            set((state) => ({ rankingVersion: (state.rankingVersion || 0) + 1 }));
          }
        )
        .subscribe();

      set({ _rankingSubscription: channel });
    },

    unsubscribeFromRankingUpdates: () => {
      const state = get();
      if (state._rankingSubscription) {
        console.log('[useRankingStore] Unsubscribing from ranking updates...');
        state._rankingSubscription.unsubscribe();
        set({ _rankingSubscription: null });
      }
    },
  };
});
