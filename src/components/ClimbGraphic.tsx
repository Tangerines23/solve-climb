import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { ArithmeticBackground, EquationsBackground } from './ClimbGraphicBackgrounds';
import { STAGE_CONFIG, type StageConfig } from '../constants/stages';
import './ClimbGraphic.css';

// 길게 누르기 기능이 있는 버튼 컴포넌트
interface LevelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onLongPress?: () => void;
  children: React.ReactNode;
}

export const LevelButton = React.forwardRef<HTMLButtonElement, LevelButtonProps>(
  ({ onLongPress, onClick, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, ...props }, ref) => {
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isLongPressing, setIsLongPressing] = useState(false);

    const handleStart = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      // disabled 상태이거나 onLongPress가 없으면 작동하지 않음
      if (props.disabled || !onLongPress) {
        return;
      }

      console.log('LevelButton: 길게 누르기 시작');
      setIsLongPressing(true);
      
      // 2초 후 토스트 표시 (첫 번째 콜백)
      toastTimerRef.current = setTimeout(() => {
        console.log('LevelButton: 2초 경과 - 토스트 표시');
        if (onLongPress) {
          onLongPress(); // 토스트 표시
        }
      }, 2000);

      // 4초 후 실제 해제 (두 번째 콜백)
      longPressTimerRef.current = setTimeout(() => {
        console.log('LevelButton: 4초 경과 - 해제');
        if (onLongPress) {
          onLongPress(); // 실제 해제
        }
        setIsLongPressing(false);
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
      }, 4000);

      if (onMouseDown && 'type' in e && e.type === 'mousedown') {
        onMouseDown(e as React.MouseEvent<HTMLButtonElement>);
      }
      if (onTouchStart && 'type' in e && e.type === 'touchstart') {
        onTouchStart(e as React.TouchEvent<HTMLButtonElement>);
      }
    }, [onLongPress, props.disabled, onMouseDown, onTouchStart]);

    const handleEnd = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      setIsLongPressing(false);

      if (onMouseUp && 'type' in e && e.type === 'mouseup') {
        onMouseUp(e as React.MouseEvent<HTMLButtonElement>);
      }
      if (onTouchEnd && 'type' in e && e.type === 'touchend') {
        onTouchEnd(e as React.TouchEvent<HTMLButtonElement>);
      }
    }, [onMouseUp, onTouchEnd]);

    useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
      };
    }, []);

    return (
      <button
        ref={ref}
        {...props}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        onClick={(e) => {
          // 길게 누르기 중이면 클릭 무시
          if (!isLongPressing && onClick) {
            onClick(e);
          }
        }}
      />
    );
  }
);

LevelButton.displayName = 'LevelButton';

interface ClimbGraphicProps {
  category: string;
  subTopic: string;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
  onLevelClick?: (level: number, levelName: string) => void;
  onLevelLongPress?: (level: number) => void;
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
  category,
  subTopic,
  levels,
  categoryColor = '#10b981',
  onLevelClick,
  onLevelLongPress,
  onUnderDevelopmentClick,
}: ClimbGraphicProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const currentLevelRef = useRef<HTMLButtonElement>(null);

  const nextLevel = getNextLevel(category, subTopic);
  const totalLevels = levels.length;

  // 개발중인 레벨 체크 함수
  const isUnderDevelopment = (level: number) => {
    const UNDER_DEVELOPMENT_LEVELS = new Set([
      // 개발 중인 레벨이 있으면 여기에 추가 (카테고리_서브토픽_레벨 형식)
    ]);
    const levelKey = `${category}_${subTopic}_${level}`;
    return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
  };

  // ========== 스테이지 헬퍼 함수 ==========
  const getStageInfo = useCallback((levelId: number): StageConfig => {
    return STAGE_CONFIG.find(
      (stage) => levelId >= stage.range[0] && levelId <= stage.range[1]
    ) || STAGE_CONFIG[0]; // Fallback
  }, []);

  // ========== 설정 상수 ==========
  const SVG_WIDTH = 400; // SVG 너비
  const NODE_SPACING = 80; // 노드 간 최소 간격 (픽셀)
  const LIST_DISTANCE = 100; // SVG 내부: 맨 위 노드가 캔버스 상단에서 100px 떨어짐
  const SCROLL_OFFSET = 60; // 외부 배치: 전체 판이 화면 상단(헤더 아래)에서 60px 내려옴

  // ========== 노드 위치 계산 ==========
  const { levelData, pathPoints, svgHeight, lastClearedIndex } = useMemo(() => {
    const data: LevelData[] = [];
    const points: Array<{ x: number; y: number }> = [];
    let lastClearedIdx = -1; // 클리어된 마지막 노드의 인덱스

    // 1. 경로 전체 높이 계산
    // 마지막 노드 Y 위치 (위에서 LIST_DISTANCE만큼 떨어짐)
    const lastNodeY = LIST_DISTANCE;
    // 첫 노드 Y 위치 (아래쪽, 경로 높이만큼 떨어짐)
    const firstNodeY = lastNodeY + (totalLevels - 1) * NODE_SPACING;
    // SVG 전체 높이 (첫 노드 위치 + 여유 공간)
    const calculatedSvgHeight = firstNodeY - 50;

    // 2. 각 노드 위치 계산
    for (let i = 0; i < totalLevels; i++) {
      // 진행도: 0 (첫 노드) ~ 1 (마지막 노드)
      const progress = i / (totalLevels - 1 || 1);

      // Y 좌표: 첫 노드에서 마지막 노드로 선형 보간
      const y = firstNodeY - (firstNodeY - lastNodeY) * progress;

      // X 좌표: S자 곡선 (중앙 기준 좌우로 움직임)
      const centerX = SVG_WIDTH * 0.5;
      const amplitude = SVG_WIDTH * 0.4; // 좌우 진폭
      const offsetX = Math.sin(progress * Math.PI * 2) * amplitude;
      const x = centerX + offsetX;

      points.push({ x, y });

      // 레벨 상태 결정
      const isCleared = isLevelCleared(category, subTopic, levels[i].level);
      const isCurrent = isAdmin ? false : levels[i].level === nextLevel;
      const status: 'locked' | 'current' | 'cleared' = isCleared
        ? 'cleared'
        : isCurrent
          ? 'current'
          : 'locked';

      // 클리어된 마지막 인덱스 추적 (성능 최적화)
      if (status === 'cleared') {
        lastClearedIdx = i;
      }

      data.push({
        id: levels[i].level,
        status,
        position: { x, y },
      });
    }

    return {
      levelData: data,
      pathPoints: points,
      svgHeight: calculatedSvgHeight,
      lastClearedIndex: lastClearedIdx,
    };
  }, [category, subTopic, levels, totalLevels, nextLevel, isLevelCleared, isAdmin]);

  // 경로 생성 함수 (통일된 로직)
  const createPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // 이전 점과 현재 점의 중간점을 제어점으로 사용하여 부드러운 곡선 생성
      const cpX = (prev.x + curr.x) / 2;
      const cpY = (prev.y + curr.y) / 2;
      path += ` Q ${cpX} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // 전체 경로와 클리어된 경로 생성
  const pathData = useMemo(() => createPath(pathPoints), [pathPoints]);
  
  const clearedPathData = useMemo(() => {
    if (lastClearedIndex < 0) return '';
    // 클리어된 마지막 노드까지의 경로 (해당 노드 포함)
    const clearedPoints = pathPoints.slice(0, lastClearedIndex + 1);
    return createPath(clearedPoints);
  }, [pathPoints, lastClearedIndex]);

  // [수정] 자동 스크롤 제거 - Base Camp 진입 시 자동으로 이동하지 않음
  // 기존의 자동 스크롤 useEffect는 제거됨

  // [신규] "내 위치로" 스크롤 함수
  const scrollToCurrentLevel = useCallback(() => {
    if (currentLevelRef.current) {
      currentLevelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);


  // 스테이지별 배경 설정
  const stageConfig = useMemo(() => {
    const configs: Record<string, StageBackgroundConfig> = {
      arithmetic: {
        // 연한 하늘색 그라데이션 (눈이 편안한 색상)
        skyGradient: 'linear-gradient(180deg, #E8F4F8 0%, #F0F8FF 50%, #FFFFFF 100%)',
        mainColor: '#1E293B', // Slate 800 (짙은 남색 블록)
        secondaryColor: '#334155', // Slate 700
        accentColor: '#475569', // Slate 600 (밝은 면)
      },
      equations: {
        // 지적이고 깊은 청록색 - 심해나 우주에 가까운 톤
        skyGradient: 'linear-gradient(180deg, #064E3B 0%, #065F46 15%, #0891B2 40%, #06B6D4 65%, #22D3EE 85%, #67E8F9 100%)',
        mainColor: '#064E3B', // Cyan-900
        secondaryColor: '#0891B2', // Cyan-600
        accentColor: '#22D3EE', // Cyan-400
      },
      sequence: {
        skyGradient: 'linear-gradient(180deg, #4B0082 0%, #6A5ACD 30%, #9370DB 60%, #BA55D3 100%)',
        mainColor: '#4B0082',
        secondaryColor: '#6A5ACD',
        accentColor: '#9370DB',
      },
      calculus: {
        skyGradient: 'linear-gradient(180deg, #000428 0%, #004e92 30%, #1a1a2e 60%, #16213e 100%)',
        mainColor: '#000428',
        secondaryColor: '#004e92',
        accentColor: '#00D4FF',
      },
    };
    return configs[subTopic] || {
      skyGradient: 'linear-gradient(180deg, #3182F6 0%, #5BA3FF 30%, #7DB8FF 60%, #A8D0FF 100%)',
      mainColor: categoryColor,
      secondaryColor: categoryColor,
      accentColor: categoryColor,
    };
  }, [subTopic, categoryColor]);

  // 절차적 생성 배경 사용 (기존 BackgroundComponent는 더 이상 사용하지 않음)

  return (
    <div
      className="level-map-container"
      data-stage={subTopic}
      style={{ 
        '--category-color': categoryColor,
        minHeight: `${svgHeight + 200}px` // SVG 높이 + 여유 공간
      } as React.CSSProperties}
    >
      {/* 하늘 그라데이션 배경 */}
      <div 
        className="level-map-sky" 
        style={{ background: stageConfig.skyGradient }}
      />

      {/* 산 배경 (새로 만든 컴포넌트) */}
      {/* CSS로 하던 .level-map-mountains 대신 이걸 씁니다 */}
      {subTopic === 'arithmetic' && (
        <ArithmeticBackground totalLevels={totalLevels} />
      )}
      {subTopic === 'equations' && (
        <EquationsBackground totalLevels={totalLevels} config={stageConfig} />
      )}

      {/* SVG 경로 영역 - 경로와 노드를 모두 포함 */}
      <div
        className="level-map-path-container"
        style={{ 
          height: `${svgHeight}px`,
          top: `${SCROLL_OFFSET}px`
        }}
      >
        <svg
          viewBox={`0 0 400 ${svgHeight}`}
          className="path-svg"
          preserveAspectRatio="xMidYMax meet"
          style={{ width: '100%', height: `${svgHeight}px` }}
        >
          {/* 토스 스타일: 부드럽고 넓은 그림자 필터 */}
          <defs>
            <filter id="toss-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.08)" />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.04)" />
            </filter>
          </defs>

          {/* 미완료 경로 (Toss UI: 얇고 연한 회색 점선) */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#E5E8EB" // Toss Grey 200
              strokeWidth="2"
              strokeDasharray="4,4" // 더 작은 점선 패턴
              className="path-future"
            />
          )}

          {/* 클리어된 경로 (Toss UI: 얇고 연한 회색 실선) */}
          {clearedPathData && (
            <path
              d={clearedPathData}
              fill="none"
              stroke="#8B95A1" // Toss Grey 400
              strokeWidth="2"
              className="path-cleared"
            />
          )}

          {/* 레벨 노드들 */}
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
                      if (level.status === 'locked') return;
                      // 개발중인 레벨이면 토스트만 표시하고 진입 차단
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
                    onLongPress={level.status === 'locked' ? undefined : () => {
                      console.log('ClimbGraphic: onLongPress 호출됨, level:', level.id, 'onLevelLongPress:', !!onLevelLongPress);
                      if (onLevelLongPress) {
                        onLevelLongPress(level.id);
                      }
                    }}
                    disabled={level.status === 'locked'}
                    style={{
                      width: '56px',
                      height: '56px',
                      margin: 0,
                      padding: 0,
                      // 스테이지별 테마 색상 적용
                      borderColor: level.status === 'current' ? stage.color : undefined,
                      boxShadow: level.status === 'current' 
                        ? `0 0 0 4px ${stage.color}40` 
                        : undefined,
                    }}
                  >
                    <div className="level-node-content">
                      {level.status === 'locked' ? (
                        <span className="level-node-icon">🔒</span>
                      ) : level.status === 'cleared' ? (
                        <span className="level-node-icon" style={{ color: stage.color }}>✓</span>
                      ) : (
                        // 진행 중일 때 스테이지 아이콘 표시
                        <span className="level-node-icon" role="img" aria-label={stage.title} style={{ color: stage.color }}>
                          {stage.icon}
                        </span>
                      )}
                      {/* 숫자는 작게 유지하여 '순서' 정보 제공 */}
                      <span className="level-node-number">{level.id}</span>
                    </div>
                  </LevelButton>
                </foreignObject>
              </g>
            );
          })}

          {/* 스테이지 표지판 (Toss Style Chips) */}
          {STAGE_CONFIG.map((stage) => {
            const startLevelIdx = stage.range[0] - 1; // 배열 인덱스 (레벨은 1부터 시작)
            const position = levelData[startLevelIdx]?.position;

            if (!position) return null;

            // 왼쪽에 붙일 스테이지: basic, focus (몸풀기는 오른쪽)
            const isLeftSide = stage.id === 'basic' || stage.id === 'focus';
            const badgeWidth = 96;
            const badgeSpacing = 42;

            // 위치 계산: 왼쪽 또는 오른쪽
            const badgeX = isLeftSide 
              ? position.x - badgeWidth - badgeSpacing  // 왼쪽: 노드 왼쪽으로 뱃지 너비 + 여백만큼
              : position.x + badgeSpacing;               // 오른쪽: 노드 오른쪽으로 여백만큼
            const badgeY = position.y - 15;

            return (
              <g key={stage.id} className="stage-signpost" style={{ animation: 'fadeIn 0.6s ease-out' }}>
                {/* 1. 연결선: 아주 얇고 연한 회색 (눈에 띌 듯 말 듯 하게) */}
                <line
                  x1={isLeftSide ? position.x - 20 : position.x + 20}
                  y1={position.y}
                  x2={isLeftSide ? badgeX + badgeWidth - 2 : badgeX + 2}
                  y2={position.y}
                  stroke="#E5E8EB" // Toss Grey 200
                  strokeWidth="1.5"
                />

                {/* 2. 뱃지 그룹 */}
                <g transform={`translate(${badgeX}, ${badgeY})`} style={{ filter: 'url(#toss-shadow)' }}>
                  {/* 배경: 완전한 흰색 캡슐 */}
                  <rect
                    width={badgeWidth}
                    height="30"
                    rx="15" // 높이의 절반 (완전한 원형 라운드)
                    fill="#FFFFFF"
                  />

                  {/* 포인트 아이콘 (스테이지 색상 원) */}
                  <circle 
                    cx={isLeftSide ? badgeWidth - 12 : 12} 
                    cy="15" 
                    r="4" 
                    fill={stage.color} 
                  />

                  {/* 텍스트: Toss Grey 컬러, 시스템 폰트 */}
                  <text
                    x={isLeftSide ? badgeWidth - 24 : 24}
                    y="20"
                    fill="#333D4B" // Toss Grey 800 (가독성 높은 진한 회색)
                    fontSize="13px"
                    fontWeight="600" // Semi-bold
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    style={{ letterSpacing: '-0.2px' }} // 자간을 살짝 좁혀서 단단해 보이게
                    textAnchor={isLeftSide ? 'end' : 'start'} // 왼쪽은 오른쪽 정렬, 오른쪽은 왼쪽 정렬
                  >
                    {stage.title}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* [신규] 내 위치로 가기 버튼 (Floating Action Button) */}
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

