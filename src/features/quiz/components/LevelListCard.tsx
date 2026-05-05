import React, { useRef } from 'react';
import { BaseCard } from '@/components/BaseCard';
import { UnderDevelopmentModal } from '@/components/UnderDevelopmentModal';
import { useLevelList } from '../hooks/bridge/useLevelList';
import type { Tier } from '@/features/quiz';
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
  const {
    showUnderDevelopment,
    setShowUnderDevelopment,
    nextLevel,
    isUnderDevelopment,
    getLevelStatus,
    getBestScore,
  } = useLevelList(world, category, tier);

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
