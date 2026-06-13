import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import {
  ArithmeticBackground,
  EquationsBackground,
  SequenceBackground,
  CalculusBackground,
} from './ClimbGraphicBackgrounds';
import { STAGE_CONFIG, type StageConfig } from '../constants/stages';
import { World, Category } from '../types/quiz';
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
  world: World;
  category: Category;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
  onLevelClick?: (level: number, levelName: string) => void;
  onUnderDevelopmentClick?: () => void;
}

interface LevelData {
  id: number;
  status: 'locked' | 'current' | 'cleared';
  position: { x: number; y: number };
}

interface StageBackgroundConfig {
  skyGradient: string;
  mainColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function ClimbGraphic({
  world,
  category,
  levels,
  categoryColor = 'var(--color-teal-500)',
  onLevelClick,
  onUnderDevelopmentClick,
}: ClimbGraphicProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const currentLevelRef = useRef<HTMLButtonElement>(null);

  const nextLevel = getNextLevel(world, category);
  const totalLevels = levels.length;

  // 개발중인 레벨 체크 함수
  const isUnderDevelopment = (level: number) => {
    const UNDER_DEVELOPMENT_LEVELS = new Set<string>([]);
    const levelKey = `${world}_${category}_${level}`;
    return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
  };

  // ========== 스테이지 헬퍼 함수 ==========
  const getStageInfo = useCallback((levelId: number): StageConfig => {
    return (
      STAGE_CONFIG.find((stage) => levelId >= stage.range[0] && levelId <= stage.range[1]) ||
      STAGE_CONFIG[0]
    );
  }, []);

  // ========== 설정 상수 ==========
  const SVG_WIDTH = 400;
  const NODE_SPACING = 80;
  const LIST_DISTANCE = 100;
  const SCROLL_OFFSET = 60;

  // ========== 노드 위치 계산 ==========
  const { levelData, pathPoints, svgHeight, lastClearedIndex } = useMemo(() => {
    const data: LevelData[] = [];
    const points: Array<{ x: number; y: number }> = [];
    let lastClearedIdx = -1;

    const lastNodeY = LIST_DISTANCE;
    const firstNodeY = lastNodeY + (totalLevels - 1) * NODE_SPACING;
    const calculatedSvgHeight = firstNodeY + 100; // 여유 공간 확보

    for (let i = 0; i < totalLevels; i++) {
      const progress = i / (totalLevels - 1 || 1);
      const y = firstNodeY - (firstNodeY - lastNodeY) * progress;
      const centerX = SVG_WIDTH * 0.5;
      const amplitude = SVG_WIDTH * 0.3;
      // [수정] S자 굴곡을 레벨 개수와 상관없이 일정하게 유지
      // 기존: Math.sin(progress * Math.PI * 2) -> 총 레벨 수에 따라 굴곡이 늘어짐
      // 변경: Math.sin((i / 15) * Math.PI * 2) -> 15개 레벨마다 1회전하도록 고정 (인덱스 기반)
      const FREQUENCY_PER_LEVELS = 15; // 15레벨마다 S자 한 번
      const offsetX = Math.sin((i / FREQUENCY_PER_LEVELS) * Math.PI * 2) * amplitude;
      const x = centerX + offsetX;

      points.push({ x, y });

      if (!Object.prototype.hasOwnProperty.call(levels, i)) continue;
      // eslint-disable-next-line security/detect-object-injection -- index validated above
      const levelId = levels[i]?.level;
      if (levelId === undefined) continue;

      const isCleared = isLevelCleared(world, category, levelId);
      const status: 'locked' | 'current' | 'cleared' = isCleared
        ? 'cleared'
        : levelId === nextLevel || (isAdmin && !isCleared)
          ? 'current'
          : 'locked';

      if (status === 'cleared') {
        lastClearedIdx = i;
      }

      data.push({
        id: levelId,
        status: status as LevelData['status'],
        position: { x, y },
      });
    }

    return {
      levelData: data,
      pathPoints: points,
      svgHeight: calculatedSvgHeight,
      lastClearedIndex: lastClearedIdx,
    };
  }, [world, category, levels, totalLevels, nextLevel, isLevelCleared, isAdmin]);

  const createPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      if (
        !Object.prototype.hasOwnProperty.call(points, i - 1) ||
        !Object.prototype.hasOwnProperty.call(points, i)
      )
        continue;
      const prev = points[i - 1];
      // eslint-disable-next-line security/detect-object-injection -- index validated above
      const curr = points[i];
      if (!prev || !curr) continue;
      const cpX = (prev.x + curr.x) / 2;
      const cpY = (prev.y + curr.y) / 2;
      path += ` Q ${cpX} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const pathData = useMemo(() => createPath(pathPoints), [pathPoints]);

  const clearedPathData = useMemo(() => {
    if (lastClearedIndex < 0) return '';
    const clearedPoints = pathPoints.slice(0, lastClearedIndex + 1);
    return createPath(clearedPoints);
  }, [pathPoints, lastClearedIndex]);

  const scrollToCurrentLevel = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (currentLevelRef.current) {
      currentLevelRef.current.scrollIntoView({
        behavior,
        block: 'center',
      });
    }
  }, []);

  // 진입 시 현재 레벨로 자동 스크롤
  useEffect(() => {
    // 월드나 카테고리가 바뀌면 현재 레벨로 즉시 정렬하여 화면 밀림(drift) 현상을 차단합니다.
    const timer = setTimeout(() => {
      scrollToCurrentLevel('auto');
    }, 50);

    return () => clearTimeout(timer);
  }, [world, category, scrollToCurrentLevel]);

  // 헬퍼 함수: 특정 world/category에 대한 StageBackgroundConfig를 계산
  const getStageConfigFor = useCallback((targetWorld: World, targetCategory: Category) => {
    const worldSkyGradients: Record<World, string> = {
      World1: 'linear-gradient(180deg, #065f46 0%, #064e3b 100%)',
      World2: 'linear-gradient(180deg, #92400e 0%, #451a03 100%)',
      World3: 'linear-gradient(180deg, #0e7490 0%, #083344 100%)',
      World4: 'linear-gradient(180deg, #09090b 0%, #000000 100%)',
      LangWorld1: 'linear-gradient(180deg, #f87171 0%, #7f1d1d 100%)',
    };

    const worldKey = targetWorld as keyof typeof worldSkyGradients;
    const worldSkyGradient = Object.prototype.hasOwnProperty.call(worldSkyGradients, worldKey)
      ? worldSkyGradients[worldKey]
      : worldSkyGradients['World1'];

    const configs: Record<string, StageBackgroundConfig> = {
      기초: {
        skyGradient: worldSkyGradient,
        mainColor: 'var(--ground-color-near)',
        secondaryColor: 'var(--ground-color-mid)',
        accentColor: 'var(--symbol-color-near)',
      },
      대수: {
        skyGradient: Object.prototype.hasOwnProperty.call(worldSkyGradients, worldKey)
          ? worldSkyGradients[worldKey]
          : 'linear-gradient(180deg, #064E3B 0%, #065F46 15%, #0891B2 40%, #06B6D4 65%, #22D3EE 85%, #67E8F9 100%)',
        mainColor: 'var(--ground-color-near)',
        secondaryColor: 'var(--ground-color-mid)',
        accentColor: 'var(--symbol-color-near)',
      },
      논리: {
        skyGradient: Object.prototype.hasOwnProperty.call(worldSkyGradients, worldKey)
          ? worldSkyGradients[worldKey]
          : 'linear-gradient(180deg, #4B0082 0%, #6A5ACD 30%, #9370DB 60%, #BA55D3 100%)',
        mainColor: 'var(--ground-color-near)',
        secondaryColor: 'var(--ground-color-mid)',
        accentColor: 'var(--symbol-color-near)',
      },
      심화: {
        skyGradient: Object.prototype.hasOwnProperty.call(worldSkyGradients, worldKey)
          ? worldSkyGradients[worldKey]
          : 'linear-gradient(180deg, #000428 0%, #004e92 30%, #1a1a2e 60%, #16213e 100%)',
        mainColor: 'var(--ground-color-near)',
        secondaryColor: 'var(--ground-color-mid)',
        accentColor: 'var(--symbol-color-near)',
      },
    };

    return Object.prototype.hasOwnProperty.call(configs, targetCategory)
      ? configs[targetCategory]
      : configs['기초'];
  }, []);

  // 카테고리 및 월드별 배경 매핑
  const stageConfig = useMemo(() => {
    return getStageConfigFor(world, category);
  }, [world, category, getStageConfigFor]);

  // 배경 크로스 페이드 상태
  const [bgStates, setBgStates] = React.useState({
    activeWorld: world,
    activeCategory: category,
    prevWorld: '' as World | '',
    prevCategory: '' as Category | '',
    isTransitioning: false,
  });

  useEffect(() => {
    if (world !== bgStates.activeWorld || category !== bgStates.activeCategory) {
      setBgStates({
        prevWorld: bgStates.activeWorld as World,
        prevCategory: bgStates.activeCategory as Category,
        activeWorld: world,
        activeCategory: category,
        isTransitioning: true,
      });

      const timer = setTimeout(() => {
        setBgStates((prev) => ({ ...prev, isTransitioning: false }));
      }, 600); // 600ms transition
      return () => clearTimeout(timer);
    }
  }, [world, category, bgStates.activeWorld, bgStates.activeCategory]);

  // 배경 개별 렌더링 헬퍼
  const renderBackground = useCallback(
    (targetWorld: World, targetCategory: Category) => {
      const config = getStageConfigFor(targetWorld, targetCategory);
      return (
        <div
          className="level-map-bg-layer"
          data-world={targetWorld}
          data-stage={targetCategory}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          {targetCategory === '기초' && (
            <ArithmeticBackground
              key={targetCategory}
              world={targetWorld}
              totalLevels={totalLevels}
            />
          )}
          {targetCategory === '대수' && (
            <EquationsBackground
              key={targetCategory}
              world={targetWorld}
              totalLevels={totalLevels}
              config={config}
            />
          )}
          {targetCategory === '논리' && (
            <SequenceBackground
              key={targetCategory}
              world={targetWorld}
              totalLevels={totalLevels}
              config={config}
            />
          )}
          {targetCategory === '심화' && (
            <CalculusBackground
              key={targetCategory}
              world={targetWorld}
              totalLevels={totalLevels}
              config={config}
            />
          )}
        </div>
      );
    },
    [totalLevels, getStageConfigFor]
  );

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
        } as React.CSSProperties
      }
    >
      {/* 이전 월드 배경 레이어 (페이드아웃) */}
      {bgStates.prevWorld && bgStates.prevCategory && (
        <div
          className="level-map-background-wrapper prev"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: bgStates.isTransitioning ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <div
            className="level-map-sky"
            style={{
              background: getStageConfigFor(
                bgStates.prevWorld as World,
                bgStates.prevCategory as Category
              ).skyGradient,
            }}
          />
          {renderBackground(bgStates.prevWorld as World, bgStates.prevCategory as Category)}
        </div>
      )}

      {/* 활성 월드 배경 레이어 (페이드인) */}
      <div
        className="level-map-background-wrapper active"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: bgStates.isTransitioning ? 0 : 1,
          transition: bgStates.isTransitioning ? 'opacity 0.6s ease-in-out' : 'none',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div className="level-map-sky" style={{ background: stageConfig.skyGradient }} />
        {renderBackground(bgStates.activeWorld as World, bgStates.activeCategory as Category)}
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
              stroke="var(--color-bg-tertiary-light)"
              strokeWidth="2"
              strokeDasharray="4,4"
              className="path-future"
            />
          )}

          {clearedPathData && (
            <path
              d={clearedPathData}
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth="2"
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
                    ref={level.status === 'current' ? currentLevelRef : null}
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
                      {level.status === 'locked' ? (
                        <span className="level-node-icon">🔒</span>
                      ) : level.status === 'cleared' ? (
                        <span className="level-node-icon" style={{ color: stage.color }}>
                          ✓
                        </span>
                      ) : (
                        <span
                          className="level-node-icon"
                          role="img"
                          aria-label={stage.title}
                          style={{ color: stage.color }}
                        >
                          {stage.icon}
                        </span>
                      )}
                      <span className="level-node-number">{level.id}</span>
                    </div>
                  </LevelButton>
                </foreignObject>
              </g>
            );
          })}

          {STAGE_CONFIG.map((stage) => {
            const startLevelIdx = stage.range[0] - 1;
            const levelNode = Object.prototype.hasOwnProperty.call(levelData, startLevelIdx)
              ? // eslint-disable-next-line security/detect-object-injection -- index validated above
                levelData[startLevelIdx]
              : undefined;
            const position = levelNode?.position;

            if (!position) return null;

            const isLeftSide = stage.id === 'basic' || stage.id === 'focus';
            const badgeWidth = 96;
            const badgeSpacing = 42;

            const badgeX = isLeftSide
              ? position.x - badgeWidth - badgeSpacing
              : position.x + badgeSpacing;
            const badgeY = position.y - 15;

            return (
              <g
                key={stage.id}
                className="stage-signpost"
                style={{ animation: 'fadeIn 0.6s ease-out' }}
              >
                <line
                  x1={isLeftSide ? position.x - 20 : position.x + 20}
                  y1={position.y}
                  x2={isLeftSide ? badgeX + badgeWidth - 2 : badgeX + 2}
                  y2={position.y}
                  stroke="var(--color-bg-tertiary-light)"
                  strokeWidth="1.5"
                />

                <g
                  transform={`translate(${badgeX}, ${badgeY})`}
                  style={{ filter: 'url(#toss-shadow)' }}
                >
                  <rect width={badgeWidth} height="30" rx="15" fill="var(--color-bg-primary)" />
                  <circle cx={isLeftSide ? badgeWidth - 12 : 12} cy="15" r="4" fill={stage.color} />
                  <text
                    x={isLeftSide ? badgeWidth - 24 : 24}
                    y="20"
                    fill="var(--color-text-primary)"
                    fontSize="13px"
                    fontWeight="600"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    style={{ letterSpacing: '-0.2px' }}
                    textAnchor={isLeftSide ? 'end' : 'start'}
                  >
                    {stage.title}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <button
        className="fab-my-location"
        onClick={() => scrollToCurrentLevel()}
        aria-label="내 레벨로 이동"
      >
        <span style={{ fontSize: '18px', marginRight: 'var(--spacing-xs)' }}>📍</span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>내 위치</span>
      </button>
    </div>
  );
}
