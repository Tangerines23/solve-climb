import React, { useState } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { UnderDevelopmentModal } from './UnderDevelopmentModal';
import { SCORE_PER_CORRECT } from '../constants/game';
import './LevelListCard.css';

interface LevelListCardProps {
  category: string;
  subTopic: string;
  levels: Array<{ level: number; name: string; description: string }>;
  onLevelClick: (level: number, levelName: string) => void;
}

// 개발 중인 레벨 목록 (카테고리_서브토픽_레벨 형식)
// 모든 레벨이 구현되었으므로 빈 Set으로 유지
const UNDER_DEVELOPMENT_LEVELS = new Set([
  // 개발 중인 레벨이 있으면 여기에 추가
]);

export function LevelListCard({
  category,
  subTopic,
  levels,
  onLevelClick,
}: LevelListCardProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getLevelProgress = useLevelProgressStore((state) => state.getLevelProgress);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const [showUnderDevelopment, setShowUnderDevelopment] = useState(false);

  const nextLevel = getNextLevel(category, subTopic);
  const progress = getLevelProgress(category, subTopic);
  
  const isUnderDevelopment = (level: number) => {
    const levelKey = `${category}_${subTopic}_${level}`;
    return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
  };

  const getLevelStatus = (level: number) => {
    // 관리자 모드면 모든 레벨이 해금됨
    if (isAdmin) {
      if (isLevelCleared(category, subTopic, level)) {
        return 'cleared';
      }
      return 'next'; // 관리자 모드에서는 모든 레벨이 도전 가능
    }
    
    // 일반 모드
    if (isLevelCleared(category, subTopic, level)) {
      return 'cleared';
    }
    if (level === nextLevel) {
      return 'next';
    }
    if (level > nextLevel) {
      return 'locked';
    }
    return 'next'; // 기본적으로 다음 도전 가능
  };

  const getBestScore = (level: number): number | null => {
    const record = progress.find((r) => r.level === level);
    if (!record) return null;
    const timeAttack = record.bestScore['time-attack'];
    const survival = record.bestScore['survival'];
    if (timeAttack === null && survival === null) return null;
    
    // 점수를 맞춘 개수로 변환
    const timeAttackCount = timeAttack !== null ? Math.floor(timeAttack / SCORE_PER_CORRECT) : null;
    const survivalCount = survival !== null ? Math.floor(survival / SCORE_PER_CORRECT) : null;
    
    if (timeAttackCount === null && survivalCount === null) return null;
    if (timeAttackCount === null) return survivalCount;
    if (survivalCount === null) return timeAttackCount;
    return Math.max(timeAttackCount, survivalCount);
  };

  return (
    <>
      <UnderDevelopmentModal
        isOpen={showUnderDevelopment}
        onClose={() => setShowUnderDevelopment(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
      <div className="level-list-card">
        <div className="level-list-header">
          <h3 className="level-list-title">레벨 목록</h3>
        </div>
        <div className="level-list-content">
          {levels.map((levelData) => {
            const status = getLevelStatus(levelData.level);
            const bestScore = getBestScore(levelData.level);
            const isDisabled = status === 'locked';
            const isDev = isUnderDevelopment(levelData.level);

            return (
              <div
                key={levelData.level}
                className={`level-list-item ${status} ${isDisabled ? 'disabled' : ''} ${isDev ? 'under-development' : ''}`}
              >
                <div className="level-list-item-left">
                  <div className="level-list-item-header">
                    <span className="level-list-item-number">Level {levelData.level}</span>
                    {isDev && (
                      <span className="level-list-status under-dev">개발중</span>
                    )}
                    {!isDev && status === 'cleared' && (
                      <span className="level-list-status cleared">클리어 ✓</span>
                    )}
                    {!isDev && status === 'locked' && (
                      <span className="level-list-status locked">잠김 🔒</span>
                    )}
                  </div>
                  <div className="level-list-item-name">{levelData.name}</div>
                  {!isDev && bestScore !== null && (
                    <div className="level-list-item-best">최고: {bestScore}개</div>
                  )}
                </div>
                <div className="level-list-item-right">
                  {isDev ? (
                    <button
                      className="level-list-button level-list-button-under-dev"
                      onClick={() => setShowUnderDevelopment(true)}
                    >
                      개발중
                    </button>
                  ) : status === 'next' ? (
                    <button
                      className="level-list-button level-list-button-primary"
                      onClick={() => onLevelClick(levelData.level, levelData.name)}
                    >
                      도전하기 &gt;
                    </button>
                  ) : status === 'cleared' ? (
                    <button
                      className="level-list-button level-list-button-secondary"
                      onClick={() => onLevelClick(levelData.level, levelData.name)}
                    >
                      다시하기 &gt;
                    </button>
                  ) : (
                    <button className="level-list-button level-list-button-disabled" disabled>
                      잠김
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

