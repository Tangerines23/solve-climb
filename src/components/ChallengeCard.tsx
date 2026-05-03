import { useChallenge } from '../hooks/useChallenge';
import { BaseCard } from './BaseCard';
import './ChallengeCard.css';

export function ChallengeCard() {
  const { challenge, loading, handleChallengeClick } = useChallenge();

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
