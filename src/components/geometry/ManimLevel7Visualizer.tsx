import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface TrapezoidKeyframe {
  topW: number;
  bottomW: number;
  height: number;
  name: string;
}

const TRAPEZOID_KEYFRAMES: TrapezoidKeyframe[] = [
  { topW: 80, bottomW: 130, height: 70, name: '사다리꼴 넓이' },
  { topW: 60, bottomW: 140, height: 80, name: '사다리꼴 넓이' },
  { topW: 90, bottomW: 120, height: 60, name: '사다리꼴 넓이' },
];

export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: TRAPEZOID_KEYFRAMES.length,
    holdDuration: 2000,
    moveDuration: 1500,
  });

  const currFrame = TRAPEZOID_KEYFRAMES[stepIndex]!;
  const nextFrame = TRAPEZOID_KEYFRAMES[(stepIndex + 1) % TRAPEZOID_KEYFRAMES.length]!;
  const eased = getEasedProgress();

  const topW = currFrame.topW + (nextFrame.topW - currFrame.topW) * eased;
  const bottomW = currFrame.bottomW + (nextFrame.bottomW - currFrame.bottomW) * eased;
  const height = currFrame.height + (nextFrame.height - currFrame.height) * eased;

  const topVal = 8;
  const bottomVal = 14;
  const heightVal = 6;
  const areaVal = ((topVal + bottomVal) * heightVal) / 2;

  const centerX = SIZE / 2;
  const centerY = 90;

  const p1 = { x: centerX - topW / 2, y: centerY - height / 2 };
  const p2 = { x: centerX + topW / 2, y: centerY - height / 2 };
  const p3 = { x: centerX + bottomW / 2, y: centerY + height / 2 };
  const p4 = { x: centerX - bottomW / 2, y: centerY + height / 2 };

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        ({topVal} + {bottomVal})
      </span>
      <span className="geo-divider">× {heightVal} ÷ 2 =</span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        넓이{' '}
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {areaVal}
        </strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName="사다리꼴 넓이 공식"
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon
          points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${p4.x.toFixed(1)},${p4.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(h) 수직선 */}
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p1.x}
          y2={p4.y}
          stroke="#60A5FA"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* 외곽선 강조 Line */}
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="geo-edge-animated-line" />
        <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} className="geo-edge-animated-line" />
        <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} className="geo-edge-animated-line" />
        <line x1={p4.x} y1={p4.y} x2={p1.x} y2={p1.y} className="geo-edge-animated-line" />

        {/* 꼭짓점 Dots */}
        <circle
          cx={p1.x}
          cy={p1.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#c084fc' }}
        />
        <circle
          cx={p2.x}
          cy={p2.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#c084fc' }}
        />
        <circle
          cx={p3.x}
          cy={p3.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />
        <circle
          cx={p4.x}
          cy={p4.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />

        {/* 치수 텍스트 */}
        <text
          x={centerX}
          y={p1.y - 8}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          윗변(a)
        </text>
        <text
          x={centerX}
          y={p4.y + 16}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          아랫변(b)
        </text>
        <text
          x={p1.x - 18}
          y={centerY + 4}
          fill="#60A5FA"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          높이(h)
        </text>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L7 Trapezoid Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel7Visualizer.displayName = 'ManimLevel7Visualizer';
