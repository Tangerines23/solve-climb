// cspell:ignore langworld langworld1
import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { ClimbBackground } from './ClimbGraphicBackgrounds';
import { getStagesForWorld, type StageConfig } from '../constants/stages';
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
  mountain?: string;
  world: World;
  category: Category;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
  onLevelClick?: (level: number, levelName: string) => void;
  onUnderDevelopmentClick?: () => void;
  isReady?: boolean;
}

interface LevelData {
  id: number;
  status: 'locked' | 'current' | 'cleared';
  position: { x: number; y: number };
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
  const currentLevelRef = useRef<HTMLButtonElement>(null);
  const lastTargetRef = useRef<string>('');
  const isFirstMountRef = useRef<boolean>(true);

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
  const SVG_WIDTH = 400;
  const NODE_SPACING = 160;
  const LIST_DISTANCE = 100;
  const SCROLL_OFFSET = 60;

  // ========== 노드 위치 계산 ==========
  const { levelData, pathPoints, svgHeight, lastClearedIndex } = useMemo(() => {
    const data: LevelData[] = [];
    const points: Array<{ x: number; y: number }> = [];
    let lastClearedIdx = -1;

    const MAX_LEVELS = 30; // 모든 월드에서 지도 높이를 30레벨(4840px)로 통일
    const lastNodeY = LIST_DISTANCE;
    const firstNodeY = lastNodeY + (MAX_LEVELS - 1) * NODE_SPACING;
    const calculatedSvgHeight = firstNodeY + 100;

    for (let i = 0; i < totalLevels; i++) {
      const y = firstNodeY - i * NODE_SPACING; // 모든 월드에서 레벨 1은 무조건 Y=2420px부터 배치
      const centerX = SVG_WIDTH * 0.5;
      const amplitude = SVG_WIDTH * 0.3;
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

  // target level ID를 결정합니다. (current 노드가 없을 경우 cleared의 마지막 노드 또는 1번 노드를 타겟팅하여 스크롤 튕김 방지)
  const targetLevelId = useMemo(() => {
    const currentLevel = levelData.find((l) => l.status === 'current');
    if (currentLevel) return currentLevel.id;

    const hasCleared = levelData.some((l) => l.status === 'cleared');
    if (hasCleared) {
      return levelData[levelData.length - 1]?.id ?? 1;
    }

    return levelData[0]?.id ?? 1;
  }, [levelData]);

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

  // 스크롤 Clamping 현상이 높이 고정화(MAX_LEVELS)로 원천 해결되어 높이 홀딩 로직 제거

  const scrollToCurrentLevel = useCallback(
    (behavior: 'auto' | 'smooth' = 'smooth') => {
      const node = currentLevelRef.current;
      if (!node) return;

      const scrollContainer = node.closest('.map-area') as HTMLElement;
      if (!scrollContainer) {
        if (typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({
            behavior: behavior === 'auto' ? 'auto' : 'smooth',
            block: 'center',
          });
        }
        return;
      }

      // [레이아웃 가드] 스크롤 컨테이너의 내부 영역(scrollHeight)이
      // 실제 지도 높이(svgHeight)에 맞게 충분히 로드되어 확장되었는지 먼저 확인합니다.
      // 렌더링 완료까지 최대 120프레임(약 2초) 동안 안전하게 대기하여 현위치 셋팅이 씹히는 오작동을 완전히 해결합니다.
      let layoutAttempts = 0;
      const executeScroll = () => {
        const currentScrollHeight = scrollContainer.scrollHeight;
        if (currentScrollHeight < svgHeight - 50 && layoutAttempts < 120) {
          layoutAttempts++;
          requestAnimationFrame(executeScroll);
          return;
        }

        // 화면 해상도나 크기에 따라 SVG가 비율 매칭되어 크기가 변하므로,
        // scrollContainer의 실제 너비를 기준으로 스케일을 계산하여 정밀한 수학적 절대 좌표를 산출합니다.
        const currentLevelNode = levelData.find((l) => l.id === targetLevelId) || levelData[0];
        const SCROLL_OFFSET = 60;
        const containerWidth = scrollContainer.clientWidth || 400;
        const scale = containerWidth / 400;
        const nodeRelativeY =
          SCROLL_OFFSET + (currentLevelNode ? currentLevelNode.position.y : 0) * scale;

        const containerHeight = scrollContainer.clientHeight || 600;
        const nodeHeight = 56; // 레벨 노드 고정 높이

        // 노드가 스크롤 영역의 정중앙에 위치하도록 목표 scrollTop 설정
        const targetScrollTop = nodeRelativeY - containerHeight / 2 + nodeHeight / 2;

        // 스크롤 상단 리밋 범위 보정 (빈 공간 스크롤 방지 이중 안전장치)
        const MAX_LEVELS = 30;
        const currentLevelsCount = levels.length;
        const emptySpaceHeight =
          currentLevelsCount < MAX_LEVELS
            ? (MAX_LEVELS - currentLevelsCount) * NODE_SPACING * scale
            : 0;

        const clampedTargetScrollTop = Math.max(emptySpaceHeight, targetScrollTop);

        // 브라우저 네이티브 스크롤 API에 온전히 가감속 제어권 위임
        scrollContainer.scrollTo({
          top: clampedTargetScrollTop,
          behavior: behavior === 'auto' ? 'auto' : 'smooth',
        });
      };

      requestAnimationFrame(executeScroll);
    },
    [levelData, targetLevelId, levels.length, svgHeight]
  );

  // 진입 및 변경 시 현재 레벨로 자동 스크롤
  useEffect(() => {
    if (isReady !== undefined && !isReady) return;

    // 월드, 카테고리, 산 정보가 실제로 변경되었을 때만 딱 1회 자동으로 스크롤 복구 위치로 보냄
    const currentTargetKey = `${mountain || ''}_${world}_${category}`;
    if (lastTargetRef.current === currentTargetKey) {
      return;
    }
    lastTargetRef.current = currentTargetKey;

    // 최초 마운트(이전 스크롤 정보가 없는 최초 진입)일 때는 애니메이션 없이 즉시 현위치를 보여주고,
    // 월드 전환 등 이전 스크롤 컨텍스트가 존재할 때는 'smooth' 모드로 스크롤합니다.
    const isFirstMount = isFirstMountRef.current;
    const scrollMode = isFirstMount ? 'auto' : 'smooth';
    isFirstMountRef.current = false;

    // 브라우저 레이아웃 엔진이 새 콘텐츠 높이 및 스케일을 확실히 반영할 수 있도록 30ms 대기 후 실행
    const timer = setTimeout(() => {
      scrollToCurrentLevel(scrollMode);
    }, 30);

    return () => clearTimeout(timer);
  }, [mountain, world, category, isReady, scrollToCurrentLevel]);

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

          {getStagesForWorld(world).map((stage) => {
            const startLevelIdx = stage.range[0] - 1;
            const levelNode = Object.prototype.hasOwnProperty.call(levelData, startLevelIdx)
              ? // eslint-disable-next-line security/detect-object-injection -- index validated above
                levelData[startLevelIdx]
              : undefined;
            const position = levelNode?.position;

            if (!position) return null;

            // 화면 경계 이탈 방지를 위한 대략적인 예측 뱃지 너비 (110px)
            const ESTIMATED_BADGE_WIDTH = 110;
            const badgeSpacing = 42;

            const leftPlacementX = position.x - ESTIMATED_BADGE_WIDTH - badgeSpacing;
            const rightPlacementX = position.x + badgeSpacing;

            let isLeftSide = true;

            if (leftPlacementX < 10) {
              isLeftSide = false;
            } else if (rightPlacementX + ESTIMATED_BADGE_WIDTH > 390) {
              isLeftSide = true;
            } else {
              const preferredLeft = stage.id === 'basic' || stage.id === 'focus';
              isLeftSide = preferredLeft;
            }

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
