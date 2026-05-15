import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore, type QuizState } from '../../stores/useQuizStore';
import { useLevelProgressStore, type LevelProgressState } from '../../stores/useLevelProgressStore';
import { useFeatureFlagStore, type FeatureFlagState } from '@/stores/useFeatureFlagStore';
import { getTodayChallenge } from '../../utils/challenge';
import type { TodayChallenge } from '../../types/challenge';
import { urls } from '@/utils/navigation';
import { Category, World, GameMode } from '../../types/quiz';

export function useChallenge() {
  const navigate = useNavigate();
  const setCategoryTopic = useQuizStore((state: QuizState) => state.setCategoryTopic);
  const setTimeLimit = useQuizStore((state: QuizState) => state.setTimeLimit);
  const progressMap = useLevelProgressStore((state: LevelProgressState) => state.progress);
  const flags = useFeatureFlagStore((state: FeatureFlagState) => state.flags);

  const [challenge, setChallenge] = useState<TodayChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayChallenge(progressMap, flags)
      .then((challengeData: TodayChallenge | null) => {
        setChallenge(challengeData);
        setLoading(false);
      })
      .catch((error: Error) => {
        console.error('Failed to load today challenge:', error);
        setLoading(false);
      });
  }, [progressMap, flags]);

  const handleChallengeClick = useCallback(() => {
    if (!challenge) return;
    setCategoryTopic(challenge.categoryId! as Category, (challenge.worldId as World) || 'World1');
    if (setTimeLimit) setTimeLimit(60);
    navigate(
      urls.quiz({
        mountain: challenge.categoryId!,
        world: challenge.worldId || 'World1',
        category: challenge.topicId!,
        level: challenge.level!,
        mode: challenge.mode as GameMode,
        challenge: 'today',
      })
    );
  }, [challenge, navigate, setCategoryTopic, setTimeLimit]);

  return {
    challenge,
    loading,
    handleChallengeClick,
  };
}
