import React, { useState, useRef } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { BaseCard } from './BaseCard';
import { UnderDevelopmentModal } from './UnderDevelopmentModal';
import type { Tier } from '../types/quiz';
import './LevelListCard.css';

interface LevelListCardProps {
  world: string;
  category: string;
  levels: Array<{ level: number; name: string; description: string }>;
  onLevelClick: (level: number, levelName: string) => void;
  onLevelLongPress?: (level: number) => void;
  onLockedLevelClick?: (level: number, nextLevel: number) => void;
  tier?: Tier;
}

// 개발 중인 레벨 목록 (월드_카테고리_레벨 형식)
const UNDER_DEVELOPMENT_LEVELS = new Set<string>([
  // 개발 중인 레벨이 있으면 여기에 추가
]);

interface LevelListItemProps {
  levelData: { level: number; name: string; description: string };
  status: 'cleared' | 'next' | 'locked';
  bestScore: number | null;
  isDisabled: boolean;
  isDev: boolean;
  nextLevel: number;
  onLevelClick: (level: number, levelName: string) => void;
  onLevelLongPress?: (level: number) => void;
  onLockedLevelClick?: (level: number, nextLevel: number) => void;
  setShowUnderDevelopment: (show: boolean) => void;
}

function LevelListItem({
  levelData,
  status,
  bestScore,
  isDisabled,
  isDev,
  nextLevel,
  onLevelClick,
  onLevelLongPress,
  onLockedLevelClick,
  setShowUnderDevelopment,
}: LevelListItemProps) {
  // 길게 누르기 타이머 관리 (각 아이템마다 독립적)
  const timersRef = useRef({
    longPress: null as NodeJS.Timeout | null,
    toast: null as NodeJS.Timeout | null,
    count: 0,
  });

  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    // 잠긴 레벨은 길게 누르기 비활성화
    if (isDisabled || !onLevelLongPress) return;

    e.stopPropagation();

    timersRef.current.count = 0;

    // 2초 후 토스트 표시
    timersRef.current.toast = setTimeout(() => {
      timersRef.current.count = 1;
      if (onLevelLongPress) {
        onLevelLongPress(levelData.level);
      }
    }, 2000);

    // 4초 후 실제 해제
    timersRef.current.longPress = setTimeout(() => {
      timersRef.current.count = 2;
      if (onLevelLongPress) {
        onLevelLongPress(levelData.level);
      }
      if (timersRef.current.toast) {
        clearTimeout(timersRef.current.toast);
        timersRef.current.toast = null;
      }
    }, 4000);
  };

  const handleLongPressEnd = (_e: React.MouseEvent | React.TouchEvent) => {
    if (timersRef.current.longPress) {
      clearTimeout(timersRef.current.longPress);
      timersRef.current.longPress = null;
    }
    if (timersRef.current.toast) {
      clearTimeout(timersRef.current.toast);
      timersRef.current.toast = null;
    }
    timersRef.current.count = 0;
  };

  const handleLockedClick = (e: React.MouseEvent) => {
    if (isDisabled && onLockedLevelClick) {
      e.stopPropagation();
      onLockedLevelClick(levelData.level, nextLevel);
    }
  };

  return (
    <div
      className={`level-list-item ${status} ${isDisabled ? 'disabled' : ''} ${isDev ? 'under-development' : ''}`}
      onMouseDown={!isDisabled ? handleLongPressStart : undefined}
      onMouseUp={!isDisabled ? handleLongPressEnd : undefined}
      onMouseLeave={!isDisabled ? handleLongPressEnd : undefined}
      onTouchStart={!isDisabled ? handleLongPressStart : undefined}
      onTouchEnd={!isDisabled ? handleLongPressEnd : undefined}
      onTouchCancel={!isDisabled ? handleLongPressEnd : undefined}
      onClick={isDisabled ? handleLockedClick : undefined}
    >
      <div className="level-list-item-left">
        <div className="level-list-item-header">
          <span className="level-list-item-number">Level {levelData.level}</span>
          {isDev && <span className="level-list-status under-dev">개발중</span>}
          {!isDev && status === 'cleared' && (
            <span className="level-list-status cleared">클리어 ✓</span>
          )}
          {!isDev && status === 'locked' && (
            <span className="level-list-status locked">잠김 🔒</span>
          )}
        </div>
        <div className="level-list-item-name">{levelData.name}</div>
        {!isDev && bestScore !== null && (
          <div className="level-list-item-best">최고: {bestScore.toLocaleString()}m</div>
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
            onClick={(e) => {
              e.stopPropagation();
              onLevelClick(levelData.level, levelData.name);
            }}
          >
            도전하기 &gt;
          </button>
        ) : status === 'cleared' ? (
          <button
            className="level-list-button level-list-button-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onLevelClick(levelData.level, levelData.name);
            }}
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
}

function LevelListCardComponent({
  world,
  category,
  levels,
  onLevelClick,
  onLevelLongPress,
  onLockedLevelClick,
  tier = 'normal',
}: LevelListCardProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getLevelProgress = useLevelProgressStore((state) => state.getLevelProgress);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const [showUnderDevelopment, setShowUnderDevelopment] = useState(false);

  const nextLevel = getNextLevel(world, category, tier);
  const progress = getLevelProgress(world, category, tier);

  const isUnderDevelopment = (level: number) => {
    const levelKey = `${world}_${category}_${level}`;
    return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
  };

  const getLevelStatus = (level: number) => {
    // 관리자 모드면 모든 레벨이 해금됨
    if (isAdmin) {
      if (isLevelCleared(world, category, level, tier)) {
        return 'cleared';
      }
      return 'next';
    }

    // 일반 모드
    if (isLevelCleared(world, category, level, tier)) {
      return 'cleared';
    }
    if (level === nextLevel) {
      return 'next';
    }
    if (level > nextLevel) {
      return 'locked';
    }
    return 'next';
  };

  const getBestScore = (level: number): number | null => {
    const record = progress.find((r) => r.level === level);
    if (!record) return null;
    const timeAttack = record.bestScore['time-attack'];
    const survival = record.bestScore['survival'];
    if (timeAttack === null && survival === null) return null;

    // 점수를 그대로 사용 (미터 단위)
    if (timeAttack === null) return survival;
    if (survival === null) return timeAttack;
    return Math.max(timeAttack, survival);
  };

  return (
    <>
      <UnderDevelopmentModal
        isOpen={showUnderDevelopment}
        onClose={() => setShowUnderDevelopment(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
      <BaseCard className="level-list-card" padding="none">
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
              <LevelListItem
                key={levelData.level}
                levelData={levelData}
                status={status}
                bestScore={bestScore}
                isDisabled={isDisabled}
                isDev={isDev}
                nextLevel={nextLevel}
                onLevelClick={onLevelClick}
                onLevelLongPress={onLevelLongPress}
                onLockedLevelClick={onLockedLevelClick}
                setShowUnderDevelopment={setShowUnderDevelopment}
              />
            );
          })}
        </div>
      </BaseCard>
    </>
  );
}

// React.memo로 메모이제이션
export const LevelListCard = React.memo(LevelListCardComponent);
