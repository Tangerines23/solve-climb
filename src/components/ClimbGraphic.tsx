// cspell:ignore langworld langworld1
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { ClimbBackground } from './ClimbGraphicBackgrounds';
import { getStagesForWorld, type StageConfig, MAP_LAYOUT } from '../constants/stages';
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
  const hasInitialScrolledRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScrollPositioned, setIsScrollPositioned] = useState(false);

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
  }, [totalLevels]);

  // ========== 노드 위치 계산 ==========
  const { levelData, pathPoints, svgHeight, lastClearedIndex } = useMemo(() => {
    const data: LevelData[] = [];
    const points: Array<{ x: number; y: number }> = [];
    let lastClearedIdx = -1;

    const lastNodeY = LIST_DISTANCE;
    const firstNodeY = lastNodeY + (FIXED_MAX_LEVELS - 1) * NODE_SPACING;
    const calculatedSvgHeight = firstNodeY + 100;

    for (let i = 0; i < totalLevels; i++) {
      const y = firstNodeY - i * NODE_SPACING; // 레벨 1은 가장 아래에 배치하고 위로 갈수록 Y가 감소(상단으로 이동)
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

  const scrollToCurrentLevel = useCallback(
    (behavior: 'auto' | 'smooth' = 'smooth') => {
      let layoutAttempts = 0;
      let nodeAttempts = 0;

      const executeScroll = () => {
        const node = currentLevelRef.current;

        // [노드 가드] 노드 엘리먼트 레프가 마운트될 때까지 최대 120프레임 동안 대기
        if (!node) {
          if (nodeAttempts < 120) {
            nodeAttempts++;
            requestAnimationFrame(executeScroll);
          } else {
            // 노드를 결국 찾지 못하더라도 화면은 보여주어야 하므로 opacity 1 설정
            setIsScrollPositioned(true);
          }
          return;
        }

        const scrollContainer = node.closest('.map-area') as HTMLElement;
        if (!scrollContainer) {
          if (typeof node.scrollIntoView === 'function') {
            node.scrollIntoView({
              behavior: behavior === 'auto' ? 'auto' : 'smooth',
              block: 'center',
            });
          }
          setIsScrollPositioned(true);
          return;
        }

        const currentScrollHeight = scrollContainer.scrollHeight;
        const currentClientWidth = scrollContainer.clientWidth;
        const currentClientHeight = scrollContainer.clientHeight;

        // [레이아웃 가드] 스크롤 영역의 유효 높이가 확보되었고,
        // 스크롤 컨테이너의 실제 화면 너비(clientWidth)와 높이(clientHeight)가 로드되어 0보다 큰지 검증
        const isLayoutReady =
          currentScrollHeight >= svgHeight - clipOffset - 50 &&
          currentClientWidth > 0 &&
          currentClientHeight > 0;

        if (!isLayoutReady && layoutAttempts < 120) {
          layoutAttempts++;
          requestAnimationFrame(executeScroll);
          return;
        }

        // 화면 해상도나 크기에 따라 SVG가 비율 매칭되어 크기가 변하므로,
        // scrollContainer의 실제 너비를 기준으로 스케일을 계산하여 정밀한 수학적 절대 좌표를 산출합니다.
        const currentLevelNode = levelData.find((l) => l.id === targetLevelId) || levelData[0];
        const scale = currentClientWidth / SVG_WIDTH;
        const nodeRelativeY =
          SCROLL_OFFSET + (currentLevelNode ? currentLevelNode.position.y : 0) * scale;

        const nodeHeight = 56; // 레벨 노드 고정 높이

        // 노드가 스크롤 영역의 정중앙에 위치하도록 목표 scrollTop 설정
        const targetScrollTop = nodeRelativeY - currentClientHeight / 2 + nodeHeight / 2;

        // 스크롤 상단 리밋 범위 보정 (활성 레벨 외 공간 진입 차단)
        const minScrollTop = clipOffset * scale;
        const clampedTargetScrollTop = Math.max(minScrollTop, targetScrollTop);

        // 브라우저 네이티브 스크롤 API에 온전히 가감속 제어권 위임
        // 자동 스크롤 진행 중임을 표시 (동작 진행 동안 handleScroll 리밋 차단 우회용)
        scrollContainer.setAttribute('data-auto-scrolling', 'true');

        scrollContainer.scrollTo({
          top: clampedTargetScrollTop,
          behavior: behavior === 'auto' ? 'auto' : 'smooth',
        });

        // 실제 스크롤 동작이 브라우저에 진입하였으므로 완료 플래그 기록
        hasInitialScrolledRef.current = true;

        // 위치 복원 완료 상태로 전환하여 페이드인 효과 트리거
        setIsScrollPositioned(true);

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        const scrollDuration = behavior === 'auto' ? 50 : 800;
        scrollTimeoutRef.current = setTimeout(() => {
          scrollContainer.removeAttribute('data-auto-scrolling');
          scrollTimeoutRef.current = null;
        }, scrollDuration);
      };

      requestAnimationFrame(executeScroll);
    },
    [levelData, targetLevelId, levels.length, svgHeight, clipOffset]
  );

  // 진입 및 변경 시 현재 레벨로 자동 스크롤
  useEffect(() => {
    if (isReady !== undefined && !isReady) return;

    const currentTargetKey = `${mountain || ''}_${world}_${category}`;

    // 월드, 카테고리, 산 정보가 변경되지 않았고, 이미 최초 스크롤이 수행된 상태라면 리턴하여 중복 스크롤 방지
    if (lastTargetRef.current === currentTargetKey && hasInitialScrolledRef.current) {
      return;
    }
    lastTargetRef.current = currentTargetKey;

    // 최초 마운트 후 첫 실제 스크롤 동작 전까지는 애니메이션 없이 즉시 현위치를 고정('auto'),
    // 첫 스크롤이 성공한 상태에서 월드/카테고리 전환이 일어날 때는 'smooth' 모드로 스크롤
    const isFirstScroll = !hasInitialScrolledRef.current;
    const scrollMode = isFirstScroll ? 'auto' : 'smooth';

    if (isFirstScroll) {
      setIsScrollPositioned(false);
    }

    // 브라우저 레이아웃 엔진이 새 콘텐츠 높이 및 스케일을 확실히 반영할 수 있도록 30ms 대기 후 실행
    const timer = setTimeout(() => {
      scrollToCurrentLevel(scrollMode);
    }, 30);

    return () => {
      clearTimeout(timer);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
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
