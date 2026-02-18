import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { getTodayChallenge, TodayChallenge } from '../utils/challenge';
import { urls } from '../utils/navigation';
import { Category, World, GameMode } from '../types/quiz';
import { BaseCard } from './BaseCard';
import './ChallengeCard.css';

export function ChallengeCard() {
  const navigate = useNavigate();
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const setTimeLimit = useQuizStore((state) => state.setTimeLimit);
  const progressMap = useLevelProgressStore((state) => state.progress);

  const [challenge, setChallenge] = useState<TodayChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayChallenge(progressMap)
      .then((challengeData) => {
        setChallenge(challengeData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load today challenge:', error);
        setLoading(false);
      });
  }, [progressMap]);

  const handleChallengeClick = () => {
    if (!challenge) return;
    setCategoryTopic(challenge.categoryId as Category, (challenge.worldId as World) || 'World1');
    if (setTimeLimit) setTimeLimit(60);
    navigate(
      urls.quiz({
        mountain: challenge.categoryId,
        world: challenge.worldId || 'World1',
        category: challenge.topicId,
        level: challenge.level,
        mode: challenge.mode as GameMode,
        challenge: 'today',
      })
    );
  };

  if (loading) {
    return (
      <BaseCard className="challenge-card">
        <div className="challenge-header">
          <span className="challenge-icon">🔥</span>
          <h2 className="challenge-title">오늘의 챌린지</h2>
        </div>
        <p className="challenge-description">로딩 중...</p>
        <button className="btn-base challenge-button" disabled>
          도전하기
        </button>
      </BaseCard>
    );
  }

  if (!challenge) {
    return (
      <BaseCard className="challenge-card">
        <div className="challenge-header">
          <span className="challenge-icon">🔥</span>
          <h2 className="challenge-title">오늘의 챌린지</h2>
        </div>
        <p className="challenge-description">챌린지를 불러올 수 없습니다.</p>
        <button className="btn-base challenge-button" disabled>
          도전하기
        </button>
      </BaseCard>
    );
  }

  return (
    <BaseCard className="challenge-card" interactive onClick={handleChallengeClick}>
      <div className="challenge-header">
        <span className="challenge-icon">🔥</span>
        <h2 className="challenge-title">오늘의 챌린지</h2>
      </div>
      <p className="challenge-description">{challenge.title}</p>
      <button
        className="btn-base btn-primary challenge-button"
        onClick={(e) => {
          e.stopPropagation();
          handleChallengeClick();
        }}
      >
        도전하기
      </button>
    </BaseCard>
  );
}
