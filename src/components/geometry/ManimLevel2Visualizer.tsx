import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

const KOREAN_POLYGON_NAMES: Record<number, string> = {
  3: '삼각형',
  4: '사각형',
  5: '오각형',
  6: '육각형',
  7: '칠각형',
  8: '팔각형',
};

const POLYGON_SEQUENCE = [4, 5, 6, 7, 8];

const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  4: computeRegularVertices(4),
  5: computeRegularVertices(5),
  6: computeRegularVertices(6),
  7: computeRegularVertices(7),
  8: computeRegularVertices(8),
};

function computeRegularVertices(n: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const radius = 56;
  const center = SIZE / 2;
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  return pts;
}

export const ManimLevel2Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: POLYGON_SEQUENCE.length,
    holdDuration: 2500,
    moveDuration: 1000,
  });

  const currSides = POLYGON_SEQUENCE[stepIndex]!;
  const nextSides = POLYGON_SEQUENCE[(stepIndex + 1) % POLYGON_SEQUENCE.length]!;

  const progress = getEasedProgress();

  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[nextSides] || computeRegularVertices(nextSides);
    if (progress <= 0) {
      return PRECOMPUTED_VERTICES[currSides] || computeRegularVertices(currSides);
    }
    if (progress >= 1) {
      return targetBase;
    }

    const startBase = PRECOMPUTED_VERTICES[currSides] || computeRegularVertices(currSides);

    if (nextSides > currSides) {
      const initialPoints: { x: number; y: number }[] = [];
      for (let i = 0; i < nextSides; i++) {
        const srcIdx = Math.min(i, startBase.length - 1);
        initialPoints.push(startBase[srcIdx]!);
      }
      return targetBase.map((tPt, i) => {
        const sPt = initialPoints[i]!;
        return {
          x: sPt.x + (tPt.x - sPt.x) * progress,
          y: sPt.y + (tPt.y - sPt.y) * progress,
        };
      });
    } else {
      return targetBase.map((tPt, i) => {
        const sPt = startBase[i % startBase.length]!;
        return {
          x: sPt.x + (tPt.x - sPt.x) * progress,
          y: sPt.y + (tPt.y - sPt.y) * progress,
        };
      });
    }
  }, [currSides, nextSides, progress]);

  const activeSides = progress > 0.5 ? nextSides : currSides;
  const activeName = KOREAN_POLYGON_NAMES[activeSides] || `${activeSides}각형`;

  const totalDiagonals = (activeSides * (activeSides - 3)) / 2;

  // Compute all diagonals for active polygon
  const diagonals = useMemo(() => {
    const res: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const pts = morphPts;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        res.push({
          x1: pts[i]!.x,
          y1: pts[i]!.y,
          x2: pts[j]!.x,
          y2: pts[j]!.y,
        });
      }
    }
    return res;
  }, [morphPts]);

  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item">
        대각선 개수 = <strong className="highlight-num">{activeSides}</strong> × (
        <strong className="highlight-num">{activeSides} - 3</strong>) ÷ 2 ={' '}
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {totalDiagonals}개
        </strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName={activeName}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

        {/* Diagonals */}
        {diagonals.map((d, idx) => (
          <line
            key={`diag-${idx}`}
            x1={d.x1}
            y1={d.y1}
            x2={d.x2}
            y2={d.y2}
            stroke="#fb7185"
            strokeWidth={1.5}
            opacity={0.85}
          />
        ))}

        {/* Outer Edges */}
        {morphPts.map((p, i) => (
          <line
            key={`edge-${i}`}
            x1={p.x}
            y1={p.y}
            x2={morphPts[(i + 1) % morphPts.length]!.x}
            y2={morphPts[(i + 1) % morphPts.length]!.y}
            className="geo-edge-animated-line"
          />
        ))}

        {/* Vertices */}
        {morphPts.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={5.5} className="geo-simple-dot" />
        ))}

        {isAdminMode && (
          <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="#c084fc" />
        )}
      </svg>
    </ManimCardLayout>
  );
});
