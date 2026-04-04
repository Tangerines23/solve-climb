import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/utils/supabaseClient';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';

export type RankingType = 'total' | 'time-attack' | 'survival';
export type RankingPeriod = 'weekly' | 'all-time';

const validateModeParam = (param: string | null): RankingType | null => {
  if (param === 'total' || param === 'time-attack' || param === 'survival') {
    return param as RankingType;
  }
  return null;
};

export function useRanking() {
  const [searchParams] = useSearchParams();
  const modeParam = validateModeParam(searchParams.get('mode'));

  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('weekly');
  const [activeType, setActiveType] = useState<RankingType>(
    modeParam === 'time-attack' ? 'time-attack' : modeParam === 'survival' ? 'survival' : 'total'
  );
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    fetchRanking,
    rankings,
    subscribeToRankingUpdates,
    unsubscribeFromRankingUpdates,
    rankingVersion,
  } = useLevelProgressStore();

  const currentRankings = useMemo(() => {
    const key = `${activePeriod}-${activeType}`;
    const entry = Object.entries(rankings).find(([k]) => k === key);
    return entry ? entry[1] : [];
  }, [rankings, activePeriod, activeType]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    });
  }, []);

  const loadRanking = useCallback(async () => {
    if (rankingVersion === 0) setLoading(true);
    await fetchRanking(null, null, activePeriod, activeType);
    if (rankingVersion === 0) setLoading(false);
  }, [activeType, activePeriod, fetchRanking, rankingVersion]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  useEffect(() => {
    if (activePeriod === 'weekly') {
      subscribeToRankingUpdates();
      return () => {
        unsubscribeFromRankingUpdates();
      };
    }
  }, [activePeriod, subscribeToRankingUpdates, unsubscribeFromRankingUpdates]);

  const myRank = useMemo(
    () => (currentUserId ? currentRankings.find((item) => item.user_id === currentUserId) : null),
    [currentUserId, currentRankings]
  );

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
  };
}
