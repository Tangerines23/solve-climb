import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface ShapeConfig {
  sides: number;
  name: string;
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  { sides: 3, name: '삼각형' },
  { sides: 4, name: '사각형' },
  { sides: 5, name: '오각형' },
  { sides: 6, name: '육각형' },
  { sides: 7, name: '칠각형' },
  { sides: 8, name: '팔각형' },
];

const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  3: computeRegularVertices(3),
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

export const ManimLevel1Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: SHAPE_CONFIGS.length,
    holdDuration: 2000, // 2.0s Hold for clear reading
    moveDuration: 1000, // 1.0s Morph move
  });

  const currentConfig = SHAPE_CONFIGS[stepIndex]!;
  const nextConfig = SHAPE_CONFIGS[(stepIndex + 1) % SHAPE_CONFIGS.length]!;

  const currSides = currentConfig.sides;
  const nextSides = nextConfig.sides;

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
  const activeName = progress > 0.5 ? nextConfig.name : currentConfig.name;

  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item">
        꼭짓점 <strong className="highlight-num">{activeSides}</strong>개
      </span>
      <span className="geo-divider">/</span>
      <span className="geo-stat-item">
        변 <strong className="highlight-num">{activeSides}</strong>개
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

        {morphPts.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={5.5} className="geo-simple-dot" />
        ))}

        {isAdminMode && <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="#c084fc" />}
      </svg>
    </ManimCardLayout>
  );
});
