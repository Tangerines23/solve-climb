import { useEffect, useState } from 'react';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';
import { useRankingStore } from '@/stores/useRankingStore';
import { storageService, STORAGE_KEYS } from '@/services';
import { historyService } from '@/services/historyService';
import { analytics } from '@/services/analytics';
import { submitScoreToLeaderboard } from '@/utils/tossGameCenter';
import { supabase } from '@/utils/supabaseClient';
import { createSafeStorageKey } from '@/utils/urlParams';
import { ANIMATION_CONFIG } from '@/constants/game';
import { logError } from '@/utils/errorHandler';
import type { Category } from '@/types/quiz';

export interface UseResultSyncParams {
  worldParam: string | null;
  categoryParam: string | null;
  level: number | null;
  mode: string | null;
  finalScore: number;
  total: number;
  correctCount: number;
  averageTime: number | null;
  searchParams: URLSearchParams;
  animationEnabled: boolean;
}

export function useResultSync({
  worldParam,
  categoryParam,
  level,
  mode,
  finalScore,
  total,
  correctCount,
  averageTime,
  searchParams,
  animationEnabled,
}: UseResultSyncParams) {
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);

  const { clearLevel, updateBestScore } = useLevelProgressStore();
  const { fetchRanking } = useRankingStore();

  useEffect(() => {
    if (!worldParam || !categoryParam || !level || !mode) return;

    const key = createSafeStorageKey(
      STORAGE_KEYS.HIGH_SCORE_PREFIX,
      worldParam,
      categoryParam,
      level,
      mode === 'time-attack' ? 'time_attack' : 'survival'
    );
    const existing = parseInt(storageService.get<string>(key) || '0', 10);
    if (finalScore > existing) {
      storageService.set(key, finalScore.toString());
      queueMicrotask(() => setIsNewRecord(true));
      if (animationEnabled) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), ANIMATION_CONFIG.CONFETTI_DURATION);
      }
    }

    const sync = async () => {
      const sessionId = searchParams.get('session_id');
      const answersRaw = searchParams.get('user_answers');
      const questionIdsRaw = searchParams.get('question_ids');

      let sessionData = undefined;
      if (sessionId && answersRaw && questionIdsRaw) {
        try {
          sessionData = {
            sessionId,
            answers: JSON.parse(answersRaw),
            questionIds: JSON.parse(questionIdsRaw),
          };
        } catch (e) {
          logError('useResultSync#parseSession', e);
        }
      }

      if (finalScore > 0) {
        const isCleared =
          mode === 'time-attack'
            ? total > 0 && Math.round((correctCount / total) * 100) >= 50 && correctCount >= 1
            : correctCount >= 1;

        if (isCleared) {
          await clearLevel(
            worldParam,
            categoryParam,
            level,
            mode === 'time-attack' ? 'time-attack' : 'survival',
            finalScore,
            averageTime ?? undefined,
            sessionData
          );
        } else {
          await updateBestScore(
            worldParam,
            categoryParam,
            level,
            mode === 'time-attack' ? 'time-attack' : 'survival',
            finalScore,
            averageTime ?? undefined,
            sessionData
          );
        }

        const rankingType = mode === 'time-attack' ? 'time-attack' : 'survival';
        await fetchRanking(worldParam, categoryParam, 'weekly', rankingType);
        await fetchRanking(null, null, 'weekly', 'total');
        await fetchRanking(null, null, 'weekly', rankingType);

        const ranks =
          useRankingStore.getState().rankings[
            `${worldParam}-${categoryParam}-weekly-${rankingType}`
          ] || useRankingStore.getState().rankings[`weekly-${rankingType}`];
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && ranks && Array.isArray(ranks)) {
          const myRanking = ranks.find((r) => r.user_id === user.id);
          if (myRanking) {
            setCurrentRank(Number(myRanking.rank));
          }
        }
      }
    };

    sync();

    if (worldParam && categoryParam && finalScore >= 0) {
      analytics.trackQuizEnd(worldParam, categoryParam, finalScore, correctCount > 0);

      analytics.trackEvent({
        category: 'quiz',
        action: 'summary',
        data: {
          total_questions: total,
          correct_count: correctCount,
          accuracy: total > 0 ? Math.round((correctCount / total) * 100) : 0,
          avg_time: averageTime,
        },
      });

      historyService.saveRecord({
        world: worldParam,
        category: categoryParam as Category,
        level: level,
        mode: mode,
        score: finalScore,
        correctCount: correctCount,
        total: total,
      });
      console.log('[useResultSync] Saved local history via historyService');
    }

    if (finalScore > 0 && !scoreSubmitted) {
      submitScoreToLeaderboard(finalScore).then(setScoreSubmitted);
    }
  }, [
    worldParam,
    categoryParam,
    level,
    mode,
    finalScore,
    total,
    correctCount,
    scoreSubmitted,
    searchParams,
    animationEnabled,
    averageTime,
    clearLevel,
    updateBestScore,
    fetchRanking,
  ]);

  return {
    isNewRecord,
    showConfetti,
    currentRank,
    scoreSubmitted,
  };
}
