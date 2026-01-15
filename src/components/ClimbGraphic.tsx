import React, { useRef, useMemo, useCallback } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { ArithmeticBackground, EquationsBackground, SequenceBackground, CalculusBackground } from './ClimbGraphicBackgrounds';
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
  categoryColor = '#10b981',
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
      const offsetX = Math.sin(progress * Math.PI * 2) * amplitude;
      const x = centerX + offsetX;

      points.push({ x, y });

      const isCleared = isLevelCleared(world, category, levels[i].level);
      const isCurrent = isAdmin ? false : levels[i].level === nextLevel;
      const status: 'locked' | 'current' | 'cleared' = isCleared
        ? 'cleared'
        : (levels[i].level === nextLevel || (isAdmin && !isCleared))
          ? 'current'
          : 'locked';

      if (status === 'cleared') {
        lastClearedIdx = i;
      }

      data.push({
        id: levels[i].level,
        status: status as any,
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
      const prev = points[i - 1];
      const curr = points[i];
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

  const scrollToCurrentLevel = useCallback(() => {
    if (currentLevelRef.current) {
      currentLevelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  // 카테고리별 배경 매핑
  const stageConfig = useMemo(() => {
    const configs: Record<string, StageBackgroundConfig> = {
      '기초': {
        skyGradient: 'linear-gradient(180deg, #E8F4F8 0%, #F0F8FF 50%, #FFFFFF 100%)',
        mainColor: 'var(--color-slate-800)',
        secondaryColor: 'var(--color-slate-700)',
        accentColor: 'var(--color-slate-600)',
      },
      '대수': {
        skyGradient: 'linear-gradient(180deg, #064E3B 0%, #065F46 15%, #0891B2 40%, #06B6D4 65%, #22D3EE 85%, #67E8F9 100%)',
        mainColor: '#064E3B',
        secondaryColor: '#0891B2',
        accentColor: '#22D3EE',
      },
      '논리': {
        skyGradient: 'linear-gradient(180deg, #4B0082 0%, #6A5ACD 30%, #9370DB 60%, #BA55D3 100%)',
        mainColor: '#4B0082',
        secondaryColor: '#6A5ACD',
        accentColor: '#9370DB',
      },
      '심화': {
        skyGradient: 'linear-gradient(180deg, #000428 0%, #004e92 30%, #1a1a2e 60%, #16213e 100%)',
        mainColor: '#000428',
        secondaryColor: '#004e92',
        accentColor: '#00D4FF',
      },
    };
    return configs[category] || configs['기초'];
  }, [category]);

  return (
    <div
      className="level-map-container"
      data-stage={category}
      style={
        {
          '--category-color': categoryColor,
          minHeight: `${svgHeight + 200}px`,
        } as React.CSSProperties
      }
    >
      <div className="level-map-sky" style={{ background: stageConfig.skyGradient }} />

      {category === '기초' && <ArithmeticBackground totalLevels={totalLevels} />}
      {category === '대수' && <EquationsBackground totalLevels={totalLevels} config={stageConfig} />}
      {category === '논리' && <SequenceBackground totalLevels={totalLevels} config={stageConfig} />}
      {category === '심화' && <CalculusBackground totalLevels={totalLevels} config={stageConfig} />}

      <div
        className="level-map-path-container"
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
              stroke="#E5E8EB"
              strokeWidth="2"
              strokeDasharray="4,4"
              className="path-future"
            />
          )}

          {clearedPathData && (
            <path
              d={clearedPathData}
              fill="none"
              stroke="#8B95A1"
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
            const position = levelData[startLevelIdx]?.position;

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
                  stroke="#E5E8EB"
                  strokeWidth="1.5"
                />

                <g
                  transform={`translate(${badgeX}, ${badgeY})`}
                  style={{ filter: 'url(#toss-shadow)' }}
                >
                  <rect
                    width={badgeWidth}
                    height="30"
                    rx="15"
                    fill="#FFFFFF"
                  />
                  <circle cx={isLeftSide ? badgeWidth - 12 : 12} cy="15" r="4" fill={stage.color} />
                  <text
                    x={isLeftSide ? badgeWidth - 24 : 24}
                    y="20"
                    fill="#333D4B"
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
        onClick={scrollToCurrentLevel}
        aria-label="내 레벨로 이동"
      >
        <span style={{ fontSize: '18px', marginRight: '4px' }}>📍</span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>내 위치</span>
      </button>
    </div>
  );
}
