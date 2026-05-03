import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useFeatureFlagStore } from '../stores/useFeatureFlagStore';
import { getTodayChallenge, TodayChallenge } from '../utils/challenge';
import { urls } from '../utils/navigation';
import { Category, World, GameMode } from '../types/quiz';

export function useChallenge() {
  const navigate = useNavigate();
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const setTimeLimit = useQuizStore((state) => state.setTimeLimit);
  const progressMap = useLevelProgressStore((state) => state.progress);
  const flags = useFeatureFlagStore((state) => state.flags);

  const [challenge, setChallenge] = useState<TodayChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayChallenge(progressMap, flags)
      .then((challengeData) => {
        setChallenge(challengeData);
        setLoading(false);
      })
      .catch((error) => {
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
