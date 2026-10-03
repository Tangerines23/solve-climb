import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRankingStore } from '@/stores/useRankingStore';
import type { RankingPeriod, RankingType } from '../types';
import { buildRankingKey, resolveModeParam } from '../utils/rankingUtils';

export type { RankingPeriod, RankingType };

export function useRanking() {
  const [searchParams] = useSearchParams();
  const initialMode = resolveModeParam(searchParams.get('mode'));

  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('weekly');
  const [activeType, setActiveType] = useState<RankingType>(initialMode);
  const [loading, setLoading] = useState(false);

  // Auth SSOT: derive directly from useAuthStore
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const {
    fetchRanking,
    rankings,
    subscribeToRankingUpdates,
    unsubscribeFromRankingUpdates,
    rankingVersion,
  } = useRankingStore();

  const currentRankings = useMemo(() => {
    const key = buildRankingKey(activePeriod, activeType);
    // eslint-disable-next-line security/detect-object-injection -- key sanitized and generated from enum values
    return rankings[key] ?? [];
  }, [rankings, activePeriod, activeType]);

  // Race condition & unmount safe data fetching
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    fetchRanking(null, null, activePeriod, activeType).finally(() => {
      if (isCurrent) {
        setLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [activePeriod, activeType, fetchRanking, rankingVersion]);

  // Realtime subscription lifecycle (Zero Else, Depth 1)
  useEffect(() => {
    if (activePeriod !== 'weekly') return;

    subscribeToRankingUpdates();
    return () => {
      unsubscribeFromRankingUpdates();
    };
  }, [activePeriod, subscribeToRankingUpdates, unsubscribeFromRankingUpdates]);

  const myRank = useMemo(() => {
    if (!currentUserId) return null;
    return currentRankings.find((item) => item.user_id === currentUserId) ?? null;
  }, [currentUserId, currentRankings]);

  const refresh = useCallback(() => {
    return fetchRanking(null, null, activePeriod, activeType);
  }, [activePeriod, activeType, fetchRanking]);

  return {
    activePeriod,
    setActivePeriod,
    activeType,
    setActiveType,
    loading,
    currentUserId,
    currentRankings,
    myRank,
    rankingVersion,
    refresh,
  };
}
