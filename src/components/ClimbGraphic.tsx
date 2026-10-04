// cspell:ignore langworld langworld1
import React, { useMemo, useCallback } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { ClimbBackground } from './ClimbGraphicBackgrounds';
import { getStagesForWorld, type StageConfig, MAP_LAYOUT } from '../constants/stages';
import { World, Category } from '../types/quiz';
import {
  calculateClimbPoints,
  createSvgSmoothPath,
  determineTargetLevelId,
  calculateSignpostPlacement,
} from '../utils/climbPathUtils';
import { useClimbScroll } from '../hooks/useClimbScroll';
import './ClimbGraphic.css';

// 단순화된 LevelButton
interface LevelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const LevelButton = React.forwardRef<HTMLButtonElement, LevelButtonProps>(
  ({ onClick, ...props }, ref) => {
    return <button ref={ref} onClick={onClick} {...props} />;
  }
);

LevelButton.displayName = 'LevelButton';

interface ClimbGraphicProps {
  mountain?: string;
  world: World;
  category: Category;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
  onLevelClick?: (level: number, levelName: string) => void;
  onUnderDevelopmentClick?: () => void;
  isReady?: boolean;
}

export function LevelNodeIcon({
  status,
  stage,
}: {
  status: 'locked' | 'current' | 'cleared';
  stage: StageConfig;
}) {
  if (status === 'locked') {
    return <span className="level-node-icon">🔒</span>;
  }
  if (status === 'cleared') {
    return (
      <span className="level-node-icon" style={{ color: stage.color }}>
        ✓
      </span>
    );
  }
  return (
    <span
      className="level-node-icon"
      role="img"
      aria-label={stage.title}
      style={{ color: stage.color }}
    >
      {stage.icon}
    </span>
  );
}

export function ClimbGraphic({
  mountain,
  world,
  category,
  levels,
  categoryColor = 'var(--color-teal-500)',
  onLevelClick,
  onUnderDevelopmentClick,
  isReady,
}: ClimbGraphicProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);

  const nextLevel = getNextLevel(world, category);
  const totalLevels = levels.length;

  // 개발중인 레벨 체크 함수
  const isUnderDevelopment = (level: number) => {
    const UNDER_DEVELOPMENT_LEVELS = new Set<string>([]);
    const levelKey = `${world}_${category}_${level}`;
    return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
  };

  // ========== 스테이지 헬퍼 함수 ==========
  const getStageInfo = useCallback(
    (levelId: number): StageConfig => {
      const worldStages = getStagesForWorld(world);
      return (
        worldStages.find((stage) => levelId >= stage.range[0] && levelId <= stage.range[1]) ||
        worldStages[0]
      );
    },
    [world]
  );

  // ========== 설정 상수 ==========
  const { SVG_WIDTH, NODE_SPACING, LIST_DISTANCE, SCROLL_OFFSET, FIXED_MAX_LEVELS } = MAP_LAYOUT;

  const clipOffset = useMemo(() => {
    return (FIXED_MAX_LEVELS - totalLevels) * NODE_SPACING;
  }, [totalLevels, FIXED_MAX_LEVELS, NODE_SPACING]);

  // ========== 노드 위치 계산 (순수 유틸 함수 분리) ==========
  const { levelData, pathPoints, svgHeight, lastClearedIndex } = useMemo(() => {
    return calculateClimbPoints({
      totalLevels,
      levels,
      fixedMaxLevels: FIXED_MAX_LEVELS,
      nodeSpacing: NODE_SPACING,
      listDistance: LIST_DISTANCE,
      svgWidth: SVG_WIDTH,
      world,
      category,
      nextLevel,
      isAdmin,
      isLevelCleared,
    });
  }, [
    totalLevels,
    levels,
    FIXED_MAX_LEVELS,
    NODE_SPACING,
    LIST_DISTANCE,
    SVG_WIDTH,
    world,
    category,
    nextLevel,
    isAdmin,
    isLevelCleared,
  ]);

  const targetLevelId = useMemo(() => determineTargetLevelId(levelData), [levelData]);

  const pathData = useMemo(() => createSvgSmoothPath(pathPoints), [pathPoints]);

  const clearedPathData = useMemo(() => {
    if (lastClearedIndex < 0) return '';
    const clearedPoints = pathPoints.slice(0, lastClearedIndex + 1);
    return createSvgSmoothPath(clearedPoints);
  }, [pathPoints, lastClearedIndex]);

  // ========== 정밀 스크롤 제어 훅 ==========
  const { currentLevelRef, isScrollPositioned } = useClimbScroll({
    levelData,
    targetLevelId,
    svgHeight,
    clipOffset,
    scrollOffset: SCROLL_OFFSET,
    svgWidth: SVG_WIDTH,
    isReady,
    mountain,
    world,
    category,
    totalLevels,
  });

  return (
    <div
      className="level-map-container"
      data-stage={category}
      data-world={world}
      data-vg-ignore="true"
      style={
        {
          '--category-color': categoryColor,
          minHeight: `${svgHeight + 200}px`,
          paddingBottom: 'calc(50vh + 120px)',
          opacity: isScrollPositioned ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        } as React.CSSProperties
      }
    >
      {/* 겹쳐진 하늘 그라데이션 레이어 */}
      <div className="level-map-sky">
        <div className="level-map-sky-glow" />
        <div className={`level-map-sky-layer world1 ${world === 'World1' ? 'active' : ''}`} />
        <div className={`level-map-sky-layer world2 ${world === 'World2' ? 'active' : ''}`} />
        <div className={`level-map-sky-layer world3 ${world === 'World3' ? 'active' : ''}`} />
        <div className={`level-map-sky-layer world4 ${world === 'World4' ? 'active' : ''}`} />
        <div
          className={`level-map-sky-layer langworld1 ${world === 'LangWorld1' ? 'active' : ''}`}
        />
      </div>

      {/* 공통 단일 배경 컴포넌트 */}
      <div className="level-map-background-wrapper" data-world={world}>
        <ClimbBackground world={world} category={category} totalLevels={totalLevels} />
      </div>

      <div
        className="level-map-path-container"
        data-vg-ignore="true"
        style={{
          height: `${svgHeight}px`,
          top: `${SCROLL_OFFSET}px`,
        }}
      >
        <svg
          viewBox={`0 0 400 ${svgHeight}`}
          className="path-svg"
          preserveAspectRatio="xMidYMax meet"
          style={{ width: '100%', height: `${svgHeight}px` }}
        >
          <defs>
            <filter id="toss-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.08)" />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.04)" />
            </filter>
          </defs>

          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="3.5"
              strokeDasharray="6,6"
              className="path-future"
            />
          )}

          {clearedPathData && (
            <path
              d={clearedPathData}
              fill="none"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="4"
              className="path-cleared"
            />
          )}

          {levelData.map((level) => {
            const levelInfo = levels.find((l) => l.level === level.id);
            if (!levelInfo) return null;

            const stage = getStageInfo(level.id);

            return (
              <g key={level.id}>
                <foreignObject
                  x={level.position.x - 28}
                  y={level.position.y - 28}
                  width="56"
                  height="56"
                  style={{ overflow: 'visible' }}
                >
                  <LevelButton
                    ref={level.id === targetLevelId ? currentLevelRef : null}
                    className={`level-node level-node-${level.status}`}
                    onClick={() => {
                      if (level.status === 'locked' && !isAdmin) return;
                      if (isUnderDevelopment(level.id)) {
                        if (onUnderDevelopmentClick) {
                          onUnderDevelopmentClick();
                        }
                        return;
                      }
                      if (onLevelClick && levelInfo) {
                        onLevelClick(level.id, levelInfo.name);
                      }
                    }}
                    disabled={level.status === 'locked' && !isAdmin}
                    style={{
                      width: '56px',
                      height: '56px',
                      margin: 0,
                      padding: 0,
                      borderColor: level.status === 'current' ? stage.color : undefined,
                      boxShadow:
                        level.status === 'current' ? `0 0 0 4px ${stage.color}40` : undefined,
                    }}
                  >
                    <div className="level-node-content">
                      <LevelNodeIcon status={level.status} stage={stage} />
                      <span className="level-node-number">{level.id}</span>
                    </div>
                  </LevelButton>
                </foreignObject>
              </g>
            );
          })}

          {getStagesForWorld(world).map((stage) => {
            const startLevelIdx = stage.range[0] - 1;
            const levelNode = Object.prototype.hasOwnProperty.call(levelData, startLevelIdx)
              ? // eslint-disable-next-line security/detect-object-injection -- index validated above
                levelData[startLevelIdx]
              : undefined;
            const position = levelNode?.position;

            if (!position) return null;

            const isLeftSide = calculateSignpostPlacement(position.x, stage.id);
            const FO_WIDTH = 220;
            const foX = isLeftSide ? position.x - 20 - FO_WIDTH : position.x + 20;
            const foY = position.y - 15;

            return (
              <g
                key={stage.id}
                className="stage-signpost"
                style={{ animation: 'fadeIn 0.6s ease-out' }}
              >
                <foreignObject
                  x={foX}
                  y={foY}
                  width={FO_WIDTH}
                  height="30"
                  style={{ overflow: 'visible' }}
                >
                  <div className={`signpost-container ${isLeftSide ? 'left-side' : 'right-side'}`}>
                    {isLeftSide ? (
                      <>
                        <div className="signpost-badge">
                          <span className="signpost-text">{stage.title}</span>
                          <span className="signpost-dot" style={{ backgroundColor: stage.color }} />
                        </div>
                        <div className="signpost-line" />
                      </>
                    ) : (
                      <>
                        <div className="signpost-line" />
                        <div className="signpost-badge">
                          <span className="signpost-dot" style={{ backgroundColor: stage.color }} />
                          <span className="signpost-text">{stage.title}</span>
                        </div>
                      </>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
