import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

interface TriangleKeyframe {
  top: Point;
  left: Point;
  right: Point;
  baseLen: number; // 수치 표시용
  heightLen: number; // 수치 표시용
  name: string;
}

const TRIANGLE_KEYFRAMES: TriangleKeyframe[] = [
  {
    top: { x: 120, y: 45 },
    left: { x: 35, y: 135 },
    right: { x: 165, y: 135 },
    baseLen: 13,
    heightLen: 9,
    name: '예각삼각형',
  },
  {
    top: { x: 45, y: 45 },
    left: { x: 45, y: 135 },
    right: { x: 165, y: 135 },
    baseLen: 12,
    heightLen: 9,
    name: '직각삼각형',
  },
  {
    top: { x: 150, y: 45 },
    left: { x: 25, y: 135 },
    right: { x: 125, y: 135 },
    baseLen: 10,
    heightLen: 9,
    name: '둔각삼각형',
  },
];

export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: TRIANGLE_KEYFRAMES.length,
    holdDuration: 2000, // 형태 완성 후 2.0초 정지 대기
    moveDuration: 1500, // 부드러운 1.5초 변형 애니메이션
  });

  const currFrame = TRIANGLE_KEYFRAMES[stepIndex]!;
  const nextFrame = TRIANGLE_KEYFRAMES[(stepIndex + 1) % TRIANGLE_KEYFRAMES.length]!;

  const eased = getEasedProgress();

  const top = {
    x: currFrame.top.x + (nextFrame.top.x - currFrame.top.x) * eased,
    y: currFrame.top.y + (nextFrame.top.y - currFrame.top.y) * eased,
  };
  const left = {
    x: currFrame.left.x + (nextFrame.left.x - currFrame.left.x) * eased,
    y: currFrame.left.y + (nextFrame.left.y - currFrame.left.y) * eased,
  };
  const right = {
    x: currFrame.right.x + (nextFrame.right.x - currFrame.right.x) * eased,
    y: currFrame.right.y + (nextFrame.right.y - currFrame.right.y) * eased,
  };

  const baseLen = Math.round(
    currFrame.baseLen + (nextFrame.baseLen - currFrame.baseLen) * eased
  );
  const heightLen = Math.round(
    currFrame.heightLen + (nextFrame.heightLen - currFrame.heightLen) * eased
  );

  const currentName = currFrame.name;

  // 복제 삼각형(180도 회전 평행사변형 완성 좌표)
  // v_ghost_top = right + (top - left)
  const ghostTop = {
    x: right.x + (top.x - left.x),
    y: right.y + (top.y - left.y),
  };

  const area = (baseLen * heightLen) / 2;
  const isDecimal = !Number.isInteger(area);

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑변 <strong className="highlight-num">{baseLen}</strong>
      </span>
      <span className="geo-divider">×</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        높이 <strong className="highlight-num">{heightLen}</strong>
      </span>
      <span className="geo-divider">÷ 2 =</span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        넓이{' '}
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {isDecimal ? area.toFixed(1) : area}
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
        {/* 복제 평행사변형 가상 가이드 영역 (투명도 점선) */}
        <polygon
          points={`${top.x.toFixed(1)},${top.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)} ${ghostTop.x.toFixed(1)},${ghostTop.y.toFixed(1)}`}
          fill="rgba(244, 63, 94, 0.12)"
          stroke="#f43f5e"
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />

        {/* 원본 삼각형 메인 영역 */}
        <polygon
          points={`${top.x.toFixed(1)},${top.y.toFixed(1)} ${left.x.toFixed(1)},${left.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(h) 수직 점선 */}
        <line
          x1={top.x}
          y1={top.y}
          x2={top.x}
          y2={left.y}
          stroke="#fb7185"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        {/* 직각 표시 (Right Angle Indicator) */}
        <path
          d={`M ${top.x} ${left.y - 8} L ${top.x + (top.x > left.x ? -8 : 8)} ${left.y - 8} L ${top.x + (top.x > left.x ? -8 : 8)} ${left.y}`}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.5}
        />

        {/* 외곽선 강조 애니메이션 Line */}
        <line x1={top.x} y1={top.y} x2={left.x} y2={left.y} className="geo-edge-animated-line" />
        <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} className="geo-edge-animated-line" />
        <line x1={right.x} y1={right.y} x2={top.x} y2={top.y} className="geo-edge-animated-line" />

        {/* 꼭짓점 정점 (Vertices) */}
        <circle cx={top.x} cy={top.y} r={5.5} className="geo-simple-dot" style={{ fill: '#c084fc' }} />
        <circle cx={left.x} cy={left.y} r={5.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />
        <circle cx={right.x} cy={right.y} r={5.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />

        {/* 텍스트 래블 (밑변 b, 높이 h) */}
        <text x={(left.x + right.x) / 2} y={left.y + 18} fill="#38bdf8" fontSize={11} fontWeight={800} textAnchor="middle">
          밑변
        </text>
        <text x={top.x + (top.x > 100 ? -16 : 16)} y={(top.y + left.y) / 2} fill="#fb7185" fontSize={11} fontWeight={800} textAnchor="middle">
          높이
        </text>

        {isAdminMode && (
          <text x={10} y={155} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L6 Triangle Area Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
