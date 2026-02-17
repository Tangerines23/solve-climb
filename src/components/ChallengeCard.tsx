import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
// import { useGameStore } from '../stores/useGameStore'; // Removed unused import
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { getTodayChallenge, TodayChallenge } from '../utils/challenge';
import { urls } from '../utils/navigation';
import { Category, World, GameMode } from '../types/quiz';
import './ChallengeCard.css';

export function ChallengeCard() {
  const navigate = useNavigate();
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const setTimeLimit = useQuizStore((state) => state.setTimeLimit);
  const progressMap = useLevelProgressStore((state) => state.progress);

  // 오늘의 챌린지 상태
  const [challenge, setChallenge] = useState<TodayChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 챌린지 가져오기 (전체 진행도 전달)
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

    // 오늘의 챌린지 설정 적용 (월드 유동적 대응)
    setCategoryTopic(challenge.categoryId as Category, (challenge.worldId as World) || 'World1');
    if (setTimeLimit) setTimeLimit(60); // 기본 1분

    // 게임 페이지로 이동 (산, 월드, 카테고리 파라미터 표준화)
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
      <div className="challenge-card">
        <div className="challenge-header">
          <span className="challenge-icon">🔥</span>
          <h2 className="challenge-title">오늘의 챌린지</h2>
        </div>
        <p className="challenge-description">로딩 중...</p>
        <button className="challenge-button" disabled>
          도전하기
        </button>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="challenge-card">
        <div className="challenge-header">
          <span className="challenge-icon">🔥</span>
          <h2 className="challenge-title">오늘의 챌린지</h2>
        </div>
        <p className="challenge-description">챌린지를 불러올 수 없습니다.</p>
        <button className="challenge-button" disabled>
          도전하기
        </button>
      </div>
    );
  }

  return (
    <div className="challenge-card">
      <div className="challenge-header">
        <span className="challenge-icon">🔥</span>
        <h2 className="challenge-title">오늘의 챌린지</h2>
      </div>
      <p className="challenge-description">{challenge.title}</p>
      <button className="challenge-button" onClick={handleChallengeClick}>
        도전하기
      </button>
    </div>
  );
}
