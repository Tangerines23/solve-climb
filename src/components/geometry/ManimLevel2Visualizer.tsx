import React, { useState, useEffect, useMemo } from 'react';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 50;

interface DiagonalLine {
  fromIdx: number;
  toIdx: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Pre-calculate fixed regular polygon vertices for 5 and 6 sides
const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  5: computeRegularVertices(5),
  6: computeRegularVertices(6),
};

function computeRegularVertices(n: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push({
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    });
  }
  return pts;
}

export const ManimLevel2Visualizer: React.FC = React.memo(() => {
  const [shapeIdx, setShapeIdx] = useState(0); // 0: 5-gon, 1: 6-gon
  const [prevSides, setPrevSides] = useState(5);
  const [currSides, setCurrSides] = useState(5);

  const [phase, setPhase] = useState<'morph' | 'single' | 'all' | 'dedup' | 'rest'>('morph');
  const [morphProgress, setMorphProgress] = useState(1);
  const [drawProgress, setDrawProgress] = useState(0);

  // Single Deterministic Timeline Engine
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;

    const MORPH_DURATION = 1200; // 1.2s vertex-split morphing
    const SINGLE_DURATION = 2000; // 2.0s single vertex (n-3) diagonals
    const ALL_DURATION = 3000; // 3.0s all vertices diagonals
    const DEDUP_DURATION = 2000; // 2.0s dedup /2 highlight
    const REST_DURATION = 800; // 0.8s rest pause

    const TOTAL_CYCLE =
      MORPH_DURATION + SINGLE_DURATION + ALL_DURATION + DEDUP_DURATION + REST_DURATION;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < MORPH_DURATION) {
        // Phase 0: Vertex-split Morphing (0s ~ 1.2s)
        setPhase('morph');
        const rawT = elapsed / MORPH_DURATION;
        const eased =
          rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
        setMorphProgress(eased);
        setDrawProgress(0);
      } else if (elapsed < MORPH_DURATION + SINGLE_DURATION) {
        // Phase 1: Draw (n-3) diagonals from V0 (1.2s ~ 3.2s)
        setPhase('single');
        setMorphProgress(1);
        setDrawProgress(Math.min((elapsed - MORPH_DURATION) / SINGLE_DURATION, 1));
      } else if (elapsed < MORPH_DURATION + SINGLE_DURATION + ALL_DURATION) {
        // Phase 2: Draw all diagonals (3.2s ~ 6.2s)
        setPhase('all');
        setMorphProgress(1);
        setDrawProgress(
          Math.min((elapsed - MORPH_DURATION - SINGLE_DURATION) / ALL_DURATION, 1)
        );
      } else if (elapsed < MORPH_DURATION + SINGLE_DURATION + ALL_DURATION + DEDUP_DURATION) {
        // Phase 3: Deduplication highlight (6.2s ~ 8.2s)
        setPhase('dedup');
        setMorphProgress(1);
        setDrawProgress(
          Math.min(
            (elapsed - MORPH_DURATION - SINGLE_DURATION - ALL_DURATION) / DEDUP_DURATION,
            1
          )
        );
      } else {
        // Phase 4: Rest Pause (8.2s ~ 9.0s)
        setPhase('rest');
        setMorphProgress(1);
        setDrawProgress(1);
      }

      if (elapsed < TOTAL_CYCLE) {
        animId = requestAnimationFrame(tick);
      } else {
        // Synchronously advance to next shape (5 -> 6 -> 5)
        const nextSides = currSides === 5 ? 6 : 5;
        setPrevSides(currSides);
        setCurrSides(nextSides);
        setShapeIdx(nextSides === 5 ? 0 : 1);
        setMorphProgress(0);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [currSides, prevSides]);

  // Memoized Morph Points (Corner Overlap Splitting 5 <-> 6)
  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[currSides] || PRECOMPUTED_VERTICES[5]!;
    if (morphProgress >= 1 || prevSides === currSides) {
      return targetBase;
    }

    if (currSides > prevSides) {
      // EXPAND / SPREAD (5 -> 6)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const initialPoints: { x: number; y: number }[] = [];
      const splitVertexIdx = 2;
      const cornerPt = startBase[splitVertexIdx]!;

      for (let i = 0; i < currSides; i++) {
        if (i <= splitVertexIdx) {
          initialPoints.push(startBase[i]!);
        } else if (i === splitVertexIdx + 1) {
          initialPoints.push(cornerPt);
        } else {
          initialPoints.push(startBase[i - 1]!);
        }
      }

      return targetBase.map((target, i) => {
        const start = initialPoints[i]!;
        return {
          x: start.x + (target.x - start.x) * morphProgress,
          y: start.y + (target.y - start.y) * morphProgress,
        };
      });
    } else {
      // SHRINK / MERGE (6 -> 5)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const target5 = PRECOMPUTED_VERTICES[currSides]!;

      const targetMap = [
        target5[0]!,
        target5[1]!,
        target5[2]!,
        target5[2]!,
        target5[3]!,
        target5[4]!,
      ];

      return startBase.map((start, i) => {
        const target = targetMap[i] || target5[4]!;
        return {
          x: start.x + (target.x - start.x) * morphProgress,
          y: start.y + (target.y - start.y) * morphProgress,
        };
      });
    }
  }, [currSides, prevSides, morphProgress]);

  // Unique Diagonals based on target morphed vertices
  const uniqueDiagonals = useMemo(() => {
    if (phase === 'morph') return [];

    const lines: DiagonalLine[] = [];
    const pts = PRECOMPUTED_VERTICES[currSides]!;
    for (let i = 0; i < currSides; i++) {
      for (let j = i + 2; j < currSides; j++) {
        if (i === 0 && j === currSides - 1) continue;
        const p1 = pts[i]!;
        const p2 = pts[j]!;
        lines.push({
          fromIdx: i,
          toIdx: j,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
        });
      }
    }
    return lines;
  }, [currSides, phase]);

  const vertex0Diagonals = useMemo(() => {
    return uniqueDiagonals.filter((d) => d.fromIdx === 0 || d.toIdx === 0);
  }, [uniqueDiagonals]);

  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  const totalDiagonals = (currSides * (currSides - 3)) / 2;
  const singleCount = currSides - 3;

  return (
    <div className="geo-level1-wrapper">
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Main Base Morphing Polygon */}
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

        {/* Outer Morphing Edges */}
        {morphPts.map((v, idx) => {
          const nextV = morphPts[(idx + 1) % morphPts.length]!;
          return (
            <line
              key={`base-edge-${idx}`}
              x1={v.x}
              y1={v.y}
              x2={nextV.x}
              y2={nextV.y}
              className="geo-edge-animated-line"
            />
          );
        })}

        {/* Phase 1: Diagonals from Vertex 0 (n - 3) */}
        {(phase === 'single' || phase === 'all') &&
          vertex0Diagonals.map((d, idx) => {
            const currentProgress = phase === 'single' ? drawProgress : 1;
            const targetX = d.fromIdx === 0 ? d.x2 : d.x1;
            const targetY = d.fromIdx === 0 ? d.y2 : d.y1;
            const sourceX = d.fromIdx === 0 ? d.x1 : d.x2;
            const sourceY = d.fromIdx === 0 ? d.y1 : d.y2;

            const drawX = sourceX + (targetX - sourceX) * currentProgress;
            const drawY = sourceY + (targetY - sourceY) * currentProgress;

            return (
              <line
                key={`v0-diag-${idx}`}
                x1={sourceX}
                y1={sourceY}
                x2={drawX}
                y2={drawY}
                stroke="#f43f5e"
                strokeWidth={3.5}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.8))' }}
              />
            );
          })}

        {/* Phase 2, 3 & Rest: All Unique Diagonals */}
        {(phase === 'all' || phase === 'dedup' || phase === 'rest') &&
          uniqueDiagonals.map((d, idx) => {
            const staggerProgress =
              phase === 'all'
                ? Math.max(0, Math.min(1, drawProgress * uniqueDiagonals.length - idx * 0.5))
                : 1;

            if (staggerProgress <= 0) return null;

            const drawX2 = d.x1 + (d.x2 - d.x1) * staggerProgress;
            const drawY2 = d.y1 + (d.y2 - d.y1) * staggerProgress;

            const isDedupHighlight = phase === 'dedup';

            return (
              <line
                key={`all-diag-${idx}`}
                x1={d.x1}
                y1={d.y1}
                x2={drawX2}
                y2={drawY2}
                stroke={isDedupHighlight ? '#fbbf24' : '#f43f5e'}
                strokeWidth={isDedupHighlight ? 3.5 : 2.5}
                strokeLinecap="round"
                opacity={isDedupHighlight ? 0.95 : 0.85}
                style={{
                  transition: 'stroke 0.4s ease, stroke-width 0.4s ease',
                  filter: isDedupHighlight
                    ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9))'
                    : 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.5))',
                }}
              />
            );
          })}

        {/* Vertex Dots */}
        {morphPts.map((v, idx) => {
          const isV0 = idx === 0;
          const isExcludedNeighbor = phase === 'single' && (idx === 1 || idx === currSides - 1);
          const isTargetVertex =
            phase === 'single' && !isV0 && !isExcludedNeighbor;

          const isHighlighted = phase === 'single' && isV0;

          return (
            <g key={`vertex-group-${idx}`}>
              <circle
                cx={v.x}
                cy={v.y}
                r={isHighlighted ? 8.5 : isTargetVertex ? 6.5 : 5}
                className={`geo-simple-dot ${isHighlighted ? 'active-dot' : ''}`}
                style={{
                  fill: isV0 ? '#fb7185' : isTargetVertex ? '#38bdf8' : '#818cf8',
                  transition: 'r 0.3s ease, fill 0.3s ease',
                }}
              />
              {/* Show Exclusion (x) indicator on neighbors during Phase 1 */}
              {isExcludedNeighbor && (
                <text
                  x={v.x}
                  y={v.y + 4}
                  fontSize={10}
                  fontWeight={900}
                  fill="#ef4444"
                  textAnchor="middle"
                >
                  ×
                </text>
              )}
            </g>
          );
        })}

        {/* Pointer Tag for Top Vertex */}
        {morphPts[0] && (
          <text x={morphPts[0].x} y={morphPts[0].y - 14} className="geo-pointer-tag vertex-tag">
            ● 꼭짓점
          </text>
        )}
      </svg>

      {/* Dynamic 3B1B Mathematical Caption Box */}
      <div className="geo-level1-caption-box">
        <span className="geo-shape-badge">{currSides}각형</span>
        <div className="geo-stat-highlights">
          {phase === 'morph' && (
            <span className="geo-stat-item edge-highlight">
              점 분할 변환 중... (<strong className="highlight-num">{currSides}각형</strong>)
            </span>
          )}
          {phase === 'single' && (
            <span className="geo-stat-item vertex-highlight active-glow">
              1개 꼭짓점 ➔ <strong className="highlight-num">({currSides} - 3) = {singleCount}개</strong> 대각선
            </span>
          )}
          {phase === 'all' && (
            <span className="geo-stat-item edge-highlight">
              전체 {currSides}개 꼭짓점 ➔ <strong className="highlight-num">{currSides} × {singleCount} = {currSides * singleCount}개</strong>
            </span>
          )}
          {(phase === 'dedup' || phase === 'rest') && (
            <span className="geo-stat-item vertex-highlight active-glow" style={{ color: '#fbbf24' }}>
              2번씩 중복(÷2) ➔ 총 <strong className="highlight-num">{totalDiagonals}개</strong> 대각선
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
