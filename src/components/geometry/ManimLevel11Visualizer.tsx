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

// Level 11: 다각형 대각선 (n(n-3)/2) 3B1B 순차 드로잉 모핑 애니메이션
// Step 0: 사각형 (대각선 2개 교차)
// Step 1: 오각형 (대각선 5개 5각 별 완성)
// Step 2: 육각형 (대각선 9개 만화경 렌더링)
export const ManimLevel11Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: DIAG_KEYFRAMES.length,
    holdDuration: 2200,
    moveDuration: 1500,
  });

  const eased = getEasedProgress();
  const currFrame = DIAG_KEYFRAMES.at(stepIndex) ?? DIAG_KEYFRAMES[0]!;
  const nextFrame =
    DIAG_KEYFRAMES.at((stepIndex + 1) % DIAG_KEYFRAMES.length) ?? DIAG_KEYFRAMES[0]!;

  // 변 수 보평 계산
  const sidesFloat = currFrame.sides + (nextFrame.sides - currFrame.sides) * eased;
  const intSides = Math.round(sidesFloat);

  const center = SIZE / 2;
  const centerY = 85;
  const radius = 55;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < intSides; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / intSides;
    pts.push({
      x: center + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  const ptsStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // 대각선 리스트
  const diagLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < intSides; i++) {
    for (let j = i + 2; j < intSides; j++) {
      if (i === 0 && j === intSides - 1) continue;
      const p1 = pts.at(i);
      const p2 = pts.at(j);
      if (p1 && p2) {
        diagLines.push({
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
        });
      }
    }
  }

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        {intSides} × ({intSides} - 3) ÷ 2 =
      </span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        대각선{' '}
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {diagLines.length}개
        </strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName={`${currFrame.name} 대각선 n(n-3)/2`}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

        {/* 대각선 순차 렌더링 Lines */}
        {diagLines.map((d, idx) => (
          <line
            key={idx}
            x1={d.x1}
            y1={d.y1}
            x2={d.x2}
            y2={d.y2}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 3"
            opacity={0.85}
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
            [DEBUG] L11 Diagonals Sequential Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel11Visualizer.displayName = 'ManimLevel11Visualizer';
