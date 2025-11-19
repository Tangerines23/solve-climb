import React from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import './ClimbGraphic.css';

interface ClimbGraphicProps {
  category: string;
  subTopic: string;
  levels: Array<{ level: number; name: string; description: string }>;
  categoryColor?: string;
}

export function ClimbGraphic({
  category,
  subTopic,
  levels,
  categoryColor = '#10b981',
}: ClimbGraphicProps) {
  const isLevelCleared = useLevelProgressStore((state) => state.isLevelCleared);
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);
  const isAdmin = useProfileStore((state) => state.isAdmin);

  const nextLevel = getNextLevel(category, subTopic);
  const totalLevels = levels.length;

  // 등반로 경로 생성 (S자형 곡선)
  const generatePath = (totalPoints: number): string => {
    const points: Array<{ x: number; y: number }> = [];
    const width = 100;
    const height = 100;
    const startX = 20;
    const startY = 80;

    for (let i = 0; i < totalPoints; i++) {
      const progress = i / (totalPoints - 1);
      // S자형 곡선 경로 생성
      const x = startX + (width * progress * 0.6) + Math.sin(progress * Math.PI * 2) * 10;
      const y = startY - (height * progress * 0.7) + Math.cos(progress * Math.PI * 1.5) * 15;
      points.push({ x, y });
    }

    // 부드러운 곡선 경로 생성 (Quadratic Bezier)
    if (points.length < 2) {
      return `M ${startX} ${startY}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // 중간 제어점 계산
      const cpX = (prev.x + curr.x) / 2;
      const cpY = (prev.y + curr.y) / 2;
      path += ` Q ${cpX} ${cpY} ${curr.x} ${curr.y}`;
    }

    return path;
  };

  const path = generatePath(totalLevels);
  const clearedCount = levels.filter((l) => isLevelCleared(category, subTopic, l.level)).length;
  const progressPercent = (clearedCount / totalLevels) * 100;

  return (
    <div className="climb-graphic" style={{ '--category-color': categoryColor } as React.CSSProperties}>
      <div className="climb-graphic-container">
        <svg
          viewBox="0 0 120 100"
          className="climb-graphic-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 배경 산 그래픽 (간단한 삼각형) */}
          <polygon
            points="0,100 60,20 120,100"
            fill={categoryColor}
            opacity="0.2"
            className="climb-mountain-bg"
          />
          <polygon
            points="20,100 50,40 80,100"
            fill={categoryColor}
            opacity="0.15"
            className="climb-mountain-bg"
          />

          {/* 등반로 경로 */}
          <path
            d={path}
            fill="none"
            stroke="#3c3c3c"
            strokeWidth="2"
            strokeDasharray="3,3"
            className="climb-path-base"
          />

          {/* 클리어한 경로 (애니메이션) */}
          {clearedCount > 0 && (
            <path
              d={path}
              fill="none"
              stroke={categoryColor}
              strokeWidth="3"
              strokeDasharray={`${progressPercent * 2} 200`}
              className="climb-path-cleared"
              style={{
                strokeDashoffset: 0,
                animation: `pathFill 1s ease-out`,
              }}
            />
          )}

          {/* 체크포인트 (레벨 마커) */}
          {levels.map((levelData, index) => {
            const progress = totalLevels > 1 ? index / (totalLevels - 1) : 0;
            const width = 100;
            const height = 100;
            const startX = 20;
            const startY = 80;
            const x = startX + (width * progress * 0.6) + Math.sin(progress * Math.PI * 2) * 10;
            const y = startY - (height * progress * 0.7) + Math.cos(progress * Math.PI * 1.5) * 15;

            const isCleared = isLevelCleared(category, subTopic, levelData.level);
            // 관리자 모드면 모든 레벨이 해금됨
            const isNext = isAdmin ? true : levelData.level === nextLevel;
            const isLocked = isAdmin ? false : levelData.level > nextLevel;

            return (
              <g key={levelData.level} className="climb-checkpoint">
                {/* 체크포인트 원 */}
                <circle
                  cx={x}
                  cy={y}
                  r={isNext ? 6 : 4}
                  fill={isCleared ? categoryColor : isNext ? '#3182f6' : '#6b7280'}
                  stroke="#1e1e1e"
                  strokeWidth="2"
                  className={isNext ? 'climb-checkpoint-next' : ''}
                />
                {/* 클리어 체크 표시 */}
                {isCleared && (
                  <text
                    x={x}
                    y={y + 2}
                    textAnchor="middle"
                    fontSize="6"
                    fill="#ffffff"
                    fontWeight="bold"
                    className="climb-checkmark"
                  >
                    ✓
                  </text>
                )}
                {/* 레벨 번호 */}
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="5"
                  fill={isLocked ? '#6b7280' : '#ffffff'}
                  fontWeight="bold"
                  className="climb-level-number"
                >
                  {levelData.level}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="climb-graphic-stats">
        <div className="climb-stats-item">
          <span className="climb-stats-label">클리어:</span>
          <span className="climb-stats-value">{clearedCount}/{totalLevels}</span>
        </div>
      </div>
    </div>
  );
}

