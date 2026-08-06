import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface PolygonDiagKeyframe {
  sides: number;
  diagonals: number;
  name: string;
}

const DIAG_KEYFRAMES: PolygonDiagKeyframe[] = [
  { sides: 4, diagonals: 2, name: '사각형' },
  { sides: 5, diagonals: 5, name: '오각형' },
  { sides: 6, diagonals: 9, name: '육각형' },
];

export const ManimLevel11Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause } = useManimEngine({
    totalSteps: DIAG_KEYFRAMES.length,
    holdDuration: 2200,
    moveDuration: 1500,
  });

  const curr = DIAG_KEYFRAMES[stepIndex]!;
  const center = SIZE / 2;
  const centerY = 85;
  const radius = 55;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < curr.sides; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / curr.sides;
    pts.push({
      x: center + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  const ptsStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // 대각선 리스트
  const diagLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < curr.sides; i++) {
    for (let j = i + 2; j < curr.sides; j++) {
      if (i === 0 && j === curr.sides - 1) continue;
      diagLines.push({
        x1: pts[i]!.x,
        y1: pts[i]!.y,
        x2: pts[j]!.x,
        y2: pts[j]!.y,
      });
    }
  }

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        n(n - 3) ÷ 2 =
      </span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        대각선{' '}
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {curr.diagonals}개
        </strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName={`${curr.name} 대각선 공식`}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

        {/* 대각선 선들 */}
        {diagLines.map((d, idx) => (
          <line
            key={idx}
            x1={d.x1}
            y1={d.y1}
            x2={d.x2}
            y2={d.y2}
            className="geo-radius-line"
            stroke="#fb7185"
          />
        ))}

        {/* 꼭짓점 Dots */}
        {pts.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={4.5}
            className="geo-simple-dot"
            style={{ fill: '#38bdf8' }}
          />
        ))}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L11 Diagonals Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel11Visualizer.displayName = 'ManimLevel11Visualizer';
