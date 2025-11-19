import React from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import './LevelListCard.css';

interface LevelListCardProps {
  category: string;
  subTopic: string;
  levels: Array<{ level: number; name: string; description: string }>;
  onLevelClick: (level: number, levelName: string) => void;
}

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

  const nextLevel = getNextLevel(category, subTopic);
  const progress = getLevelProgress(category, subTopic);

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
    if (timeAttack === null) return survival;
    if (survival === null) return timeAttack;
    return Math.max(timeAttack, survival);
  };

  return (
    <div className="level-list-card">
      <div className="level-list-header">
        <h3 className="level-list-title">레벨 목록</h3>
      </div>
      <div className="level-list-content">
        {levels.map((levelData) => {
          const status = getLevelStatus(levelData.level);
          const bestScore = getBestScore(levelData.level);
          const isDisabled = status === 'locked';

          return (
            <div
              key={levelData.level}
              className={`level-list-item ${status} ${isDisabled ? 'disabled' : ''}`}
            >
              <div className="level-list-item-left">
                <div className="level-list-item-header">
                  <span className="level-list-item-number">Level {levelData.level}</span>
                  {status === 'cleared' && (
                    <span className="level-list-status cleared">클리어 ✓</span>
                  )}
                  {status === 'locked' && (
                    <span className="level-list-status locked">잠김 🔒</span>
                  )}
                </div>
                <div className="level-list-item-name">{levelData.name}</div>
                {bestScore !== null && (
                  <div className="level-list-item-best">최고: {bestScore}개</div>
                )}
              </div>
              <div className="level-list-item-right">
                {status === 'next' && (
                  <button
                    className="level-list-button level-list-button-primary"
                    onClick={() => onLevelClick(levelData.level, levelData.name)}
                  >
                    도전하기 &gt;
                  </button>
                )}
                {status === 'cleared' && (
                  <button
                    className="level-list-button level-list-button-secondary"
                    onClick={() => onLevelClick(levelData.level, levelData.name)}
                  >
                    다시하기 &gt;
                  </button>
                )}
                {status === 'locked' && (
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
  );
}

