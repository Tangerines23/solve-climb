import React, { useEffect, useRef, useMemo } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import './ClimbGraphic.css';

interface ClimbGraphicProps {
  category: string;
  subTopic: string;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
  onLevelClick?: (level: number, levelName: string) => void;
}

interface LevelData {
  id: number;
  status: 'locked' | 'current' | 'cleared';
  position: { x: number; y: number };
}

export function ClimbGraphic({
  category,
  subTopic,
  levels,
  categoryColor = '#10b981',
  onLevelClick,
}: ClimbGraphicProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const currentLevelRef = useRef<HTMLButtonElement>(null);

  const nextLevel = getNextLevel(category, subTopic);
  const totalLevels = levels.length;

  // 레벨 데이터 생성 및 경로 좌표 계산
  const { levelData, pathData, pathPoints, svgHeight } = useMemo(() => {
    const data: LevelData[] = [];
    const points: Array<{ x: number; y: number }> = [];

    // SVG 경로 생성 (S자 곡선)
    const svgWidth = 400; // SVG 너비
    // 한 화면에 모든 레벨이 보이도록 높이 조정
    // 레벨 수에 따라 간격을 동적으로 계산 (최소 50px, 최대 70px)
    const minSpacing = 50;
    const maxSpacing = 70;
    const targetHeight = 500; // 목표 높이 (화면에 맞게)
    const levelSpacing = Math.max(minSpacing, Math.min(maxSpacing, targetHeight / totalLevels));
    const calculatedSvgHeight = 100 + (totalLevels - 1) * levelSpacing; // 상단 여유 + 레벨 간격
    const startY = calculatedSvgHeight * 0.9; // 시작 위치 (하단)
    const endY = calculatedSvgHeight * 0.1; // 끝 위치 (상단)

    // S자 곡선 경로 생성 (Cubic Bezier 사용)
    for (let i = 0; i < totalLevels; i++) {
      const progress = i / (totalLevels - 1 || 1);

      // S자 곡선: 중앙을 기준으로 좌우로 움직임
      const centerX = svgWidth * 0.5;
      const centerY = startY - (startY - endY) * progress;

      // 1-3(/), 4-6(\), 7-9(/), 10-12(|) 패턴 구현
      // 1.5 사이클 (3 * PI) 사용
      // 시작점(L1)이 왼쪽(-1)에서 시작하도록 위상 조정 (-PI/2)
      const frequency = 3 * Math.PI;
      const phase = -Math.PI / 2;

      // 요청하신 대로 좌우 굴곡을 확실하게 주기 위해 진폭을 크게 유지
      const amplitude = svgWidth * 0.35;

      // 상단 10,11,12 레벨(progress > 0.75)에서는 진폭을 줄여서 수직 느낌 내기
      const dampening = progress > 0.75 ? 0.5 : 1.0;

      const offsetX = Math.sin(progress * frequency + phase) * amplitude * dampening;

      const x = centerX + offsetX;
      const y = centerY;

      points.push({ x, y });

      // 레벨 상태 결정
      const isCleared = isLevelCleared(category, subTopic, levels[i].level);
      const isCurrent = isAdmin ? false : levels[i].level === nextLevel;

      const status: 'locked' | 'current' | 'cleared' = isCleared
        ? 'cleared'
        : isCurrent
          ? 'current'
          : 'locked';

      // SVG viewBox 좌표를 그대로 사용 (노드 컨테이너도 동일한 viewBox 사용)
      data.push({
        id: levels[i].level,
        status,
        position: {
          x: x, // SVG 좌표 직접 저장
          y: y,
        },
      });
    }

    // Cubic Bezier 곡선으로 부드러운 경로 생성 (더 자연스러운 곡선)
    let path = '';
    if (points.length > 0) {
      path = `M ${points[0].x} ${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];

        // 이전/다음 점을 고려한 더 부드러운 제어점 계산
        const prev = i > 0 ? points[i - 1] : curr;
        const after = i < points.length - 2 ? points[i + 2] : next;

        // 방향 벡터 계산 (더 자연스러운 곡선을 위해)
        const tension = 0.25;
        const dx1 = (next.x - prev.x) * tension;
        const dy1 = (next.y - prev.y) * tension;
        const dx2 = (after.x - curr.x) * tension;
        const dy2 = (after.y - curr.y) * tension;

        // 제어점 계산 (더 부드럽고 자연스러운 곡선)
        const cp1X = curr.x + dx1;
        const cp1Y = curr.y + dy1;
        const cp2X = next.x - dx2;
        const cp2Y = next.y - dy2;

        path += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
      }
    }

    return {
      levelData: data,
      pathData: path,
      pathPoints: points,
      svgHeight: calculatedSvgHeight,
    };
  }, [category, subTopic, levels, totalLevels, nextLevel, isLevelCleared, isAdmin]);

  // 현재 레벨로 자동 스크롤 (부모 컨테이너로 스크롤)
  useEffect(() => {
    if (currentLevelRef.current) {
      const currentButton = currentLevelRef.current;
      const scrollContainer = currentButton.closest('.level-select-page') as HTMLElement;

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const buttonRect = currentButton.getBoundingClientRect();

        const scrollTop = scrollContainer.scrollTop;
        const buttonTop = buttonRect.top - containerRect.top + scrollTop;
        const containerHeight = containerRect.height;

        // 현재 레벨이 화면 중앙에 오도록 스크롤
        const targetScroll = buttonTop - containerHeight / 2 + currentButton.offsetHeight / 2;

        scrollContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    }
  }, [levelData]);

  // 클리어된 경로와 미완료 경로 분리
  const clearedPathData = useMemo(() => {
    if (pathPoints.length < 2) return '';

    const clearedCount = levelData.filter((d) => d.status === 'cleared').length;
    if (clearedCount === 0) return '';

    const clearedPoints = pathPoints.slice(0, clearedCount + 1);
    if (clearedPoints.length < 2) return '';

    let path = `M ${clearedPoints[0].x} ${clearedPoints[0].y}`;

    for (let i = 0; i < clearedPoints.length - 1; i++) {
      const curr = clearedPoints[i];
      const next = clearedPoints[i + 1];

      // 이전/다음 점을 고려한 더 부드러운 제어점 계산
      const prev = i > 0 ? clearedPoints[i - 1] : curr;
      const after = i < clearedPoints.length - 2 ? clearedPoints[i + 2] : next;

      // 방향 벡터 계산
      const tension = 0.25;
      const dx1 = (next.x - prev.x) * tension;
      const dy1 = (next.y - prev.y) * tension;
      const dx2 = (after.x - curr.x) * tension;
      const dy2 = (after.y - curr.y) * tension;

      // 제어점 계산
      const cp1X = curr.x + dx1;
      const cp1Y = curr.y + dy1;
      const cp2X = next.x - dx2;
      const cp2Y = next.y - dy2;

      path += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
    }

    return path;
  }, [pathPoints, levelData]);

  return (
    <div
      className="level-map-container"
      style={{ '--category-color': categoryColor } as React.CSSProperties}
    >
      {/* 하늘 그라데이션 배경 */}
      <div className="level-map-sky" />

      {/* 산 배경 */}
      <div className="level-map-mountains">
        <svg
          viewBox="0 -100 400 400"
          className="mountain-background-svg"
          preserveAspectRatio="xMidYMax slice"
        >
          {/* 1. 먼 산 (가장 높은 산, 화면의 70% 높이) - 폭을 줄여서 더 높고 뾰족하게 보이도록 수정 */}
          <polygon
            points="50,300 200,-100 350,300"
            fill={categoryColor}
            opacity="0.3"
            className="mountain-bg-far"
          />

          {/* 2. 중간 산 (좌우 중간 높이, 화면의 50% 높이) - 폭을 줄여서 더 뾰족하게 */}
          <polygon
            points="-20,300 80, -100 180,300"
            fill={categoryColor}
            opacity="0.5"
            className="mountain-bg-mid"
          />
          <polygon
            points="220,300 320,70 420,300"
            fill={categoryColor}
            opacity="0.5"
            className="mountain-bg-mid"
          />

          {/* 3. 낮은 산 (맨 앞, 화면의 20~30% 높이) - 폭을 줄여서 더 뾰족하게 */}
          <polygon
            points="0,300 60,230 120,300"
            fill={categoryColor}
            opacity="0.8"
            className="mountain-bg-near"
          />
          <polygon
            points="140,300 200,210 260,300"
            fill={categoryColor}
            opacity="0.8"
            className="mountain-bg-near"
          />
          <polygon
            points="280,300 340,230 400,300"
            fill={categoryColor}
            opacity="0.8"
            className="mountain-bg-near"
          />
        </svg>
      </div>

      {/* SVG 경로 영역 - 경로와 노드를 모두 포함 */}
      <div
        className="level-map-path-container"
        style={{ height: `${svgHeight}px` }}
      >
        <svg
          viewBox={`0 0 400 ${svgHeight}`}
          className="path-svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 200px)' }}
        >
          {/* 미완료 경로 (점선) */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="6"
              strokeDasharray="10,10"
              className="path-future"
            />
          )}

          {/* 클리어된 경로 (실선, 50% 투명도) */}
          {clearedPathData && (
            <path
              d={clearedPathData}
              fill="none"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="6"
              className="path-cleared"
            />
          )}

          {/* 레벨 노드들 - SVG 내부에 배치하여 정확한 좌표 일치 */}
          {levelData.map((level) => {
            const levelInfo = levels.find((l) => l.level === level.id);
            if (!levelInfo) return null;

            return (
              <g key={level.id}>
                <foreignObject
                  x={level.position.x - 28}
                  y={level.position.y - 28}
                  width="56"
                  height="56"
                  style={{ overflow: 'visible' }}
                >
                  <button
                    ref={level.status === 'current' ? currentLevelRef : null}
                    className={`level-node level-node-${level.status}`}
                    onClick={() => {
                      if (level.status !== 'locked' && onLevelClick && levelInfo) {
                        onLevelClick(level.id, levelInfo.name);
                      }
                    }}
                    disabled={level.status === 'locked'}
                    style={{
                      width: '56px',
                      height: '56px',
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    <div className="level-node-content">
                      {level.status === 'locked' && (
                        <span className="level-node-icon">🔒</span>
                      )}
                      {level.status === 'current' && (
                        <span className="level-node-icon">📍</span>
                      )}
                      {level.status === 'cleared' && (
                        <span className="level-node-icon">✓</span>
                      )}
                      <span className="level-node-number">{level.id}</span>
                    </div>
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
