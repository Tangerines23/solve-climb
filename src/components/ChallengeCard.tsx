import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useQuizStore } from '../stores/useQuizStore';
import './ChallengeCard.css';

export function ChallengeCard() {
  const navigate = useNavigate();
  // Zustand Selector 패턴 적용
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const setTimeLimit = useQuizStore((state) => state.setTimeLimit);
  const challenge = APP_CONFIG.TODAY_CHALLENGE;

  const handleChallengeClick = () => {
    // 오늘의 챌린지 설정 적용
    setCategoryTopic(challenge.category as any, challenge.topic as any);
    setTimeLimit(60); // 기본 1분
    
    // 게임 페이지로 이동
    navigate(`${APP_CONFIG.ROUTES.GAME}?challenge=today&mode=${challenge.mode}&level=${challenge.level}`);
  };

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

