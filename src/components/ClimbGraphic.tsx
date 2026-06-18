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

const getBadgeWidth = (title: string): number => {
  if (!title) return 96;
  let width = 0;
  for (let i = 0; i < title.length; i++) {
    const code = title.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      width += 13.5;
    } else {
      width += 7.5;
    }
  }
  return Math.ceil(width + 36);
};

interface ClimbGraphicProps {
  mountain?: string;
  world: World;
  category: Category;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
  onLevelClick?: (level: number, levelName: string) => void;
  onUnderDevelopmentClick?: () => void;
  isReady?: boolean;
  lastScrollTop?: number;
  fromScrollTop?: number;
  onTransitionStart?: () => void;
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
  lastScrollTop,
  fromScrollTop,
  onTransitionStart,
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

    const MAX_LEVELS = totalLevels;
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
    (behavior: 'auto' | 'smooth' | 'transition' = 'smooth') => {
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

      // 화면 해상도나 크기에 따라 SVG가 비율 매칭되어 크기가 변하므로,
      // scrollContainer의 실제 너비를 기준으로 스케일을 계산하여 정밀한 수학적 절대 좌표를 산출합니다.
      // getBoundingClientRect는 레이아웃 완료 시점에 영향을 받아 튕김이나 0px 측정 오류를 유발하므로 수학적 계산을 1순위로 채택합니다.
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

      if (behavior === 'auto') {
        scrollContainer.scrollTop = targetScrollTop;

        // [자가 보정] 브라우저 레이아웃(scrollHeight)이 비동기적으로 확장되는 시점의 타이밍 지연으로 인해
        // scrollTop 세팅이 무시되거나 중간에 클램핑되는 현상을 방지하기 위해 정교한 재시도 루프를 적용합니다.
        let attempts = 0;
        let lastScrollTop = -1;
        const retryScroll = () => {
          scrollContainer.scrollTop = targetScrollTop;
          const currentScroll = scrollContainer.scrollTop;
          const isClose = Math.abs(currentScroll - targetScrollTop) < 3;

          // 목표에 충분히 도달했거나, 경계선 도달 등으로 스크롤 위치가 5프레임 이상 고정된 경우 중단
          if (isClose || (currentScroll === lastScrollTop && attempts > 5) || attempts >= 30) {
            return;
          }

          lastScrollTop = currentScroll;
          attempts++;
          requestAnimationFrame(retryScroll);
        };
        requestAnimationFrame(retryScroll);
      } else if (behavior === 'transition') {
        // 'transition' 모드: 이전 월드에서 보던 위치(start)에서 새 월드의 이전 위치 또는 현레벨 위치(target)로 스크롤
        const startScrollTop =
          fromScrollTop !== undefined ? fromScrollTop : scrollContainer.scrollTop;

        // 트랜지션 시작 처리가 완료되어 시작점을 구했으므로 부모 상태를 소비 처리
        if (onTransitionStart) {
          onTransitionStart();
        }

        // 만약 prop으로 이전 마지막 스크롤 위치가 주어졌다면 그것을 목표값으로 삼고, 없다면 현재 레벨 기준 계산값을 사용합니다.
        const finalTargetScrollTop = lastScrollTop !== undefined ? lastScrollTop : targetScrollTop;

        const correctedTargetScrollTop = finalTargetScrollTop;

        let attempts = 0;
        let lastScrollTopVal = -1;

        const initializeAndAnimate = () => {
          scrollContainer.scrollTop = startScrollTop;
          const currentScroll = scrollContainer.scrollTop;
          const isInitialized =
            Math.abs(currentScroll - startScrollTop) < 3 ||
            (currentScroll === lastScrollTopVal && attempts > 5);

          if (isInitialized || attempts >= 25) {
            const start = scrollContainer.scrollTop;
            const change = correctedTargetScrollTop - start;
            const startTime = performance.now();
            const duration = 800; // 부드럽게 감속하는 Easing 모션 프레임 적용

            const easeInOutQuart = (t: number) => {
              return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
            };

            const animateScroll = (currentTime: number) => {
              const timeElapsed = currentTime - startTime;
              const progress = Math.min(timeElapsed / duration, 1);
              const easedProgress = easeInOutQuart(progress);

              scrollContainer.scrollTop = start + change * easedProgress;

              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              }
            };

            requestAnimationFrame(animateScroll);
            return;
          }

          lastScrollTopVal = currentScroll;
          attempts++;
          requestAnimationFrame(initializeAndAnimate);
        };

        requestAnimationFrame(initializeAndAnimate);
      } else {
        // 'smooth' 모드 (내 위치 버튼 등): 현재의 실제 스크롤 위치에서부터 targetScrollTop까지 부드럽게 이동
        const start = scrollContainer.scrollTop;
        const change = targetScrollTop - start;
        const startTime = performance.now();
        const duration = 850; // 0.85초 동안 유려하게 가감속

        const easeInOutQuart = (t: number) => {
          return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
        };

        const animateScroll = (currentTime: number) => {
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          const easedProgress = easeInOutQuart(progress);

          scrollContainer.scrollTop = start + change * easedProgress;

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    },
    [levelData, targetLevelId]
  );

  // 진입 및 변경 시 현재 레벨로 자동 스크롤
  useEffect(() => {
    if (isReady !== undefined && !isReady) return;

    // 브라우저 레이아웃 엔진이 새 콘텐츠 높이 및 스케일을 확실히 반영할 수 있도록 30ms 대기 후 실행
    const timer = setTimeout(() => {
      scrollToCurrentLevel('transition');
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

            const badgeWidth = getBadgeWidth(stage.title);
            const badgeSpacing = 42;

            const leftPlacementX = position.x - badgeWidth - badgeSpacing;
            const rightPlacementX = position.x + badgeSpacing;

            let isLeftSide = true;
            let badgeX = leftPlacementX;

            if (leftPlacementX < 10) {
              isLeftSide = false;
              badgeX = rightPlacementX;
            } else if (rightPlacementX + badgeWidth > 390) {
              isLeftSide = true;
              badgeX = leftPlacementX;
            } else {
              const preferredLeft = stage.id === 'basic' || stage.id === 'focus';
              isLeftSide = preferredLeft;
              badgeX = preferredLeft ? leftPlacementX : rightPlacementX;
            }

            if (badgeX < 10) {
              badgeX = 10;
            } else if (badgeX + badgeWidth > 390) {
              badgeX = 390 - badgeWidth;
            }

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
