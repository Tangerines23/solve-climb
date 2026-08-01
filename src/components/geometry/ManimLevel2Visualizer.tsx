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

// 5 Sub-Phases per Polygon:
// 0: Morph Base (3.0s) -> "꼭짓점 N개 / 변 N개"
// 1: Single Vertex Diagonals (3.0s) -> "1개 꼭짓점 ➔ (n-3)개 대각선"
// 2: All Vertices Diagonals (3.0s) -> "n개 꼭짓점 × (n-3)개"
// 3: Gold Dedup Highlight (4.0s) -> "중복 2번씩 겹침! ➔ ÷ 2"
// 4: Final Formula (3.0s) -> "n × (n - 3) ÷ 2 = 대각선 개수"

const PHASE_DURATIONS = [3000, 3000, 3000, 4000, 3000];
const SINGLE_SHAPE_DURATION = PHASE_DURATIONS.reduce((a, b) => a + b, 0); // 16,000ms (16s per polygon)

export const ManimLevel2Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { isPaused, togglePause, t } = useManimEngine({
    totalSteps: POLYGON_SEQUENCE.length,
    holdDuration: SINGLE_SHAPE_DURATION - 1000,
    moveDuration: 1000,
  });

  const totalCycle = POLYGON_SEQUENCE.length * SINGLE_SHAPE_DURATION;
  const elapsedMs = t * totalCycle;

  const shapeIdx = Math.floor(elapsedMs / SINGLE_SHAPE_DURATION) % POLYGON_SEQUENCE.length;
  const shapeElapsed = elapsedMs % SINGLE_SHAPE_DURATION;

  const currSides = POLYGON_SEQUENCE[shapeIdx]!;
  const nextSides = POLYGON_SEQUENCE[(shapeIdx + 1) % POLYGON_SEQUENCE.length]!;

  // Determine current sub-phase within the polygon narrative
  let currentPhase = 0;
  let phaseElapsed = shapeElapsed;
  let accum = 0;
  for (let p = 0; p < PHASE_DURATIONS.length; p++) {
    if (shapeElapsed < accum + PHASE_DURATIONS[p]!) {
      currentPhase = p;
      phaseElapsed = shapeElapsed - accum;
      break;
    }
    accum += PHASE_DURATIONS[p]!;
  }

  // Morph progress (only during transition to next shape at the end of phase 4)
  const isMorphing = shapeElapsed >= SINGLE_SHAPE_DURATION - 1000;
  const morphProgress = isMorphing ? (shapeElapsed - (SINGLE_SHAPE_DURATION - 1000)) / 1000 : 0;

  const morphPts = useMemo(() => {
    const startBase = PRECOMPUTED_VERTICES[currSides] || computeRegularVertices(currSides);
    if (!isMorphing || morphProgress <= 0) return startBase;

    const targetBase = PRECOMPUTED_VERTICES[nextSides] || computeRegularVertices(nextSides);
    const eased = morphProgress * morphProgress * (3 - 2 * morphProgress);

    if (nextSides > currSides) {
      const initialPoints: { x: number; y: number }[] = [];
      for (let i = 0; i < nextSides; i++) {
        const srcIdx = Math.min(i, startBase.length - 1);
        initialPoints.push(startBase[srcIdx]!);
      }
      return targetBase.map((tPt, i) => {
        const sPt = initialPoints[i]!;
        return {
          x: sPt.x + (tPt.x - sPt.x) * eased,
          y: sPt.y + (tPt.y - sPt.y) * eased,
        };
      });
    } else {
      return targetBase.map((tPt, i) => {
        const sPt = startBase[i % startBase.length]!;
        return {
          x: sPt.x + (tPt.x - sPt.x) * eased,
          y: sPt.y + (tPt.y - sPt.y) * eased,
        };
      });
    }
  }, [currSides, nextSides, isMorphing, morphProgress]);

  const activeName = KOREAN_POLYGON_NAMES[currSides] || `${currSides}각형`;
  const totalDiagonals = (currSides * (currSides - 3)) / 2;
  const singleCount = currSides - 3;

  // Single vertex (v0) diagonals
  const v0Diagonals = useMemo(() => {
    const res: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const pts = morphPts;
    const n = pts.length;
    const v0 = pts[0]!;
    for (let j = 2; j < n - 1; j++) {
      res.push({ x1: v0.x, y1: v0.y, x2: pts[j]!.x, y2: pts[j]!.y });
    }
    return res;
  }, [morphPts]);

  // All diagonals
  const allDiagonals = useMemo(() => {
    const res: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const pts = morphPts;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        res.push({ x1: pts[i]!.x, y1: pts[i]!.y, x2: pts[j]!.x, y2: pts[j]!.y });
      }
    }
    return res;
  }, [morphPts]);

  // Render narrative subtext caption
  const caption = useMemo(() => {
    switch (currentPhase) {
      case 0:
        return (
          <div className="geo-stat-highlights" key="phase-0">
            <span className="geo-stat-item">
              꼭짓점 <strong className="highlight-num">{currSides}</strong>개
            </span>
            <span className="geo-divider">/</span>
            <span className="geo-stat-item">
              변 <strong className="highlight-num">{currSides}</strong>개
            </span>
          </div>
        );

      case 1:
        return (
          <div className="geo-stat-highlights" key="phase-1">
            <span className="geo-stat-item" style={{ color: '#c084fc' }}>
              1개 꼭짓점 ➔ (<strong className="highlight-num">{currSides} - 3</strong>) ={' '}
              <strong className="highlight-num">{singleCount}</strong>개 대각선
            </span>
          </div>
        );

      case 2:
        return (
          <div className="geo-stat-highlights" key="phase-2">
            <span className="geo-stat-item" style={{ color: '#fb7185' }}>
              <strong className="highlight-num">{currSides}</strong>개 꼭짓점 ×{' '}
              <strong className="highlight-num">{singleCount}</strong>개 ={' '}
              <strong className="highlight-num">{currSides * singleCount}</strong>선분
            </span>
          </div>
        );

      case 3:
        return (
          <div className="geo-stat-highlights" key="phase-3">
            <span className="geo-stat-item" style={{ color: '#facc15' }}>
              중복 2번씩 겹침! ➔ <strong className="highlight-num" style={{ color: '#facc15' }}>÷ 2</strong>
            </span>
          </div>
        );

      case 4:
      default:
        return (
          <div className="geo-stat-highlights" key="phase-4">
            <span className="geo-stat-item">
              대각선 = <strong className="highlight-num">{currSides}</strong> × (
              <strong className="highlight-num">{singleCount}</strong>) ÷ 2 ={' '}
              <strong className="highlight-num" style={{ color: '#4ade80' }}>
                {totalDiagonals}개
              </strong>
            </span>
          </div>
        );
    }
  }, [currentPhase, currSides, singleCount, totalDiagonals]);

  // Phase 1 drawing progress (0 ~ 1.5s draw, 1.5s ~ 3.0s hold)
  const phase1Progress = currentPhase === 1 ? Math.min(1, phaseElapsed / 1500) : 1;
  const phase1Eased = phase1Progress * phase1Progress * (3 - 2 * phase1Progress);

  // Phase 2 drawing progress (0 ~ 2.5s draw, 2.5s ~ 3.0s hold)
  const phase2Progress = currentPhase === 2 ? Math.min(1, phaseElapsed / 2500) : 1;
  const phase2Eased = phase2Progress * phase2Progress * (3 - 2 * phase2Progress);

  // Phase 3 gold highlight
  const isGoldGlow = currentPhase === 3 && phaseElapsed < 3000;

  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
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

        {/* Phase 1: Diagonals from Vertex 0 */}
        {currentPhase === 1 &&
          v0Diagonals.map((d, idx) => {
            const drawX = d.x1 + (d.x2 - d.x1) * phase1Eased;
            const drawY = d.y1 + (d.y2 - d.y1) * phase1Eased;
            return (
              <line
                key={`v0-diag-${idx}`}
                x1={d.x1}
                y1={d.y1}
                x2={drawX}
                y2={drawY}
                stroke="#c084fc"
                strokeWidth={2.2}
              />
            );
          })}

        {/* Phase 2, 3, 4: All Diagonals */}
        {currentPhase >= 2 &&
          allDiagonals.map((d, idx) => {
            const drawX = currentPhase === 2 ? d.x1 + (d.x2 - d.x1) * phase2Eased : d.x2;
            const drawY = currentPhase === 2 ? d.y1 + (d.y2 - d.y1) * phase2Eased : d.y2;
            const strokeColor = isGoldGlow ? '#facc15' : '#fb7185';
            const strokeW = isGoldGlow ? 2.5 : 1.5;

            return (
              <line
                key={`all-diag-${idx}`}
                x1={d.x1}
                y1={d.y1}
                x2={drawX}
                y2={drawY}
                stroke={strokeColor}
                strokeWidth={strokeW}
                style={{
                  filter: isGoldGlow ? 'drop-shadow(0 0 4px #facc15)' : 'none',
                  transition: 'stroke 0.3s ease',
                }}
              />
            );
          })}

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
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={i === 0 && currentPhase === 1 ? 7 : 5.5}
            fill={i === 0 && currentPhase === 1 ? '#c084fc' : '#a5b4fc'}
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}

        {isAdminMode && <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="#c084fc" />}
      </svg>
    </ManimCardLayout>
  );
});
