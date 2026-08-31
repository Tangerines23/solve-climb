import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface RectKeyframe {
  cols: number;
  rows: number;
  name: string;
}

const RECT_KEYFRAMES: RectKeyframe[] = [
  { cols: 6, rows: 4, name: '직사각형' },
  { cols: 5, rows: 5, name: '정사각형' },
  { cols: 8, rows: 3, name: '직사각형' },
  { cols: 4, rows: 6, name: '직사각형' },
];

// 최대 8x8 그리드선 사전 생성 배열
const MAX_GRID_INDEXES = [1, 2, 3, 4, 5, 6, 7];

// Level 5: 직사각형 넓이 (그리드를 미리 생성하여 생겼다 사라지는 현상 완벽 방지)
export const ManimLevel5Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: RECT_KEYFRAMES.length,
    holdDuration: 2000,
    moveDuration: 1500,
  });

  const currentFrame = RECT_KEYFRAMES.at(stepIndex) ?? RECT_KEYFRAMES[0]!;
  const nextFrame =
    RECT_KEYFRAMES.at((stepIndex + 1) % RECT_KEYFRAMES.length) ?? RECT_KEYFRAMES[0]!;

  const eased = getEasedProgress();
  const cols = currentFrame.cols + (nextFrame.cols - currentFrame.cols) * eased;
  const rows = currentFrame.rows + (nextFrame.rows - currentFrame.rows) * eased;

  const currentName = currentFrame.name;

  const cellPixel = 18;
  const widthPx = cols * cellPixel;
  const heightPx = rows * cellPixel;

  const rectX = (SIZE - widthPx) / 2;
  const rectY = 48 + (100 - heightPx) / 2;

  const roundedCols = Math.round(cols);
  const roundedRows = Math.round(rows);
  const area = roundedCols * roundedRows;

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        가로 <strong className="highlight-num">{roundedCols}</strong>
      </span>
      <span className="geo-divider">×</span>
      <span className="geo-stat-item" style={{ color: '#f43f5e' }}>
        세로 <strong className="highlight-num">{roundedRows}</strong>
      </span>
      <span className="geo-divider">=</span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        넓이{' '}
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {area}
        </strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName={currentName}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* L4 이전 CSS 표준과 100% 동일한 rgba(99, 102, 241, 0.15) 면색 적용 */}
        <rect
          x={rectX}
          y={rectY}
          width={widthPx}
          height={heightPx}
          fill="rgba(99, 102, 241, 0.15)"
          stroke="#38bdf8"
          strokeWidth={2.5}
          rx={4}
          ry={4}
          style={{ transition: 'none' }}
        />

        {/* 사전 미리 생성된 그리드 점선 (부드러운 opacity 모핑으로 깜빡임 100% 완전 방지!) */}
        {MAX_GRID_INDEXES.map((idx) => {
          const posX = rectX + idx * cellPixel;
          // 가로 프레임 범위 안쪽인지 계산
          const isVisible = idx < cols - 0.05;
          const opacity = isVisible ? Math.min(1, (cols - idx) * 2) * 0.35 : 0;
          if (opacity <= 0) return null;
          return (
            <line
              key={`v-grid-${idx}`}
              x1={posX}
              y1={rectY}
              x2={posX}
              y2={rectY + heightPx}
              stroke="#38bdf8"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={opacity}
            />
          );
        })}

        {MAX_GRID_INDEXES.map((idx) => {
          const posY = rectY + idx * cellPixel;
          // 세로 프레임 범위 안쪽인지 계산
          const isVisible = idx < rows - 0.05;
          const opacity = isVisible ? Math.min(1, (rows - idx) * 2) * 0.35 : 0;
          if (opacity <= 0) return null;
          return (
            <line
              key={`h-grid-${idx}`}
              x1={rectX}
              y1={posY}
              x2={rectX + widthPx}
              y2={posY}
              stroke="#38bdf8"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={opacity}
            />
          );
        })}

        {/* 가로 치수 라인 (Cyan #38bdf8) */}
        <line
          x1={rectX}
          y1={rectY - 12}
          x2={rectX + widthPx}
          y2={rectY - 12}
          stroke="#38bdf8"
          strokeWidth={2}
        />
        <line
          x1={rectX}
          y1={rectY - 16}
          x2={rectX}
          y2={rectY - 8}
          stroke="#38bdf8"
          strokeWidth={1.5}
        />
        <line
          x1={rectX + widthPx}
          y1={rectY - 16}
          x2={rectX + widthPx}
          y2={rectY - 8}
          stroke="#38bdf8"
          strokeWidth={1.5}
        />
        <text
          x={rectX + widthPx / 2}
          y={rectY - 18}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="middle"
        >
          가로 {roundedCols}
        </text>

        {/* 세로 치수 라인 (L1~L4와 100% 통일된 Rose/Red #f43f5e) */}
        <line
          x1={rectX + widthPx + 12}
          y1={rectY}
          x2={rectX + widthPx + 12}
          y2={rectY + heightPx}
          stroke="#f43f5e"
          strokeWidth={2}
        />
        <line
          x1={rectX + widthPx + 8}
          y1={rectY}
          x2={rectX + widthPx + 16}
          y2={rectY}
          stroke="#f43f5e"
          strokeWidth={1.5}
        />
        <line
          x1={rectX + widthPx + 8}
          y1={rectY + heightPx}
          x2={rectX + widthPx + 16}
          y2={rectY + heightPx}
          stroke="#f43f5e"
          strokeWidth={1.5}
        />
        <text
          x={rectX + widthPx + 18}
          y={rectY + heightPx / 2 + 4}
          fontSize={11}
          fontWeight={800}
          fill="#f43f5e"
          textAnchor="start"
        >
          세로 {roundedRows}
        </text>

        {/* 중앙 넓이 칸 수 표시 */}
        <text
          x={rectX + widthPx / 2}
          y={rectY + heightPx / 2 + 4}
          fontSize={13}
          fontWeight={900}
          fill="#ffffff"
          textAnchor="middle"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
        >
          {area}칸
        </text>

        {isAdminMode && (
          <circle cx={rectX + widthPx / 2} cy={rectY + heightPx / 2} r={3} fill="#f43f5e" />
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel5Visualizer.displayName = 'ManimLevel5Visualizer';
