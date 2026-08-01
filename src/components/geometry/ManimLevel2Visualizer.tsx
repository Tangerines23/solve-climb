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

function computeVertices(n: number) {
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
  const [sides, setSides] = useState(5); // Alternates between 5 (pentagon) & 6 (hexagon)
  const [phase, setPhase] = useState<'single' | 'all' | 'dedup' | 'rest'>('single');
  const [drawProgress, setDrawProgress] = useState(0);

  const vertices = useMemo(() => computeVertices(sides), [sides]);

  // Compute all valid diagonals (i < j and not adjacent)
  const uniqueDiagonals = useMemo(() => {
    const lines: DiagonalLine[] = [];
    for (let i = 0; i < sides; i++) {
      for (let j = i + 2; j < sides; j++) {
        if (i === 0 && j === sides - 1) continue; // Skip adjacent wrap-around edge
        const p1 = vertices[i]!;
        const p2 = vertices[j]!;
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
  }, [vertices, sides]);

  // Diagonals originating from vertex 0 (First phase: n - 3 diagonals)
  const vertex0Diagonals = useMemo(() => {
    return uniqueDiagonals.filter((d) => d.fromIdx === 0 || d.toIdx === 0);
  }, [uniqueDiagonals]);

  // Master Deterministic Timeline for Level 2-2
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;

    const SINGLE_DURATION = 2000; // Phase 1: Draw (n-3) diagonals from V0 (2s)
    const ALL_DURATION = 3000; // Phase 2: Draw all n*(n-3) directed diagonals (3s)
    const DEDUP_DURATION = 2000; // Phase 3: Highlight overlap & deduplicate /2 (2s)
    const REST_DURATION = 800; // Phase 4: Rest pause (0.8s)

    const TOTAL_CYCLE = SINGLE_DURATION + ALL_DURATION + DEDUP_DURATION + REST_DURATION;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < SINGLE_DURATION) {
        setPhase('single');
        setDrawProgress(Math.min(elapsed / SINGLE_DURATION, 1));
      } else if (elapsed < SINGLE_DURATION + ALL_DURATION) {
        setPhase('all');
        setDrawProgress(Math.min((elapsed - SINGLE_DURATION) / ALL_DURATION, 1));
      } else if (elapsed < SINGLE_DURATION + ALL_DURATION + DEDUP_DURATION) {
        setPhase('dedup');
        setDrawProgress(Math.min((elapsed - SINGLE_DURATION - ALL_DURATION) / DEDUP_DURATION, 1));
      } else {
        setPhase('rest');
        setDrawProgress(1);
      }

      if (elapsed < TOTAL_CYCLE) {
        animId = requestAnimationFrame(tick);
      } else {
        // Toggle polygon between 5-gon and 6-gon
        setSides((s) => (s === 5 ? 6 : 5));
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [sides]);

  const totalDiagonals = (sides * (sides - 3)) / 2;
  const singleCount = sides - 3;

  return (
    <div className="geo-level1-wrapper">
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Main Base Polygon */}
        <polygon
          points={vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')}
          className="geo-shape-poly-morph"
        />

        {/* Outer Edges */}
        {vertices.map((v, idx) => {
          const nextV = vertices[(idx + 1) % vertices.length]!;
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
            // Stagger drawing for Phase 'all'
            const staggerProgress =
              phase === 'all'
                ? Math.max(0, Math.min(1, (drawProgress * uniqueDiagonals.length - idx * 0.5)))
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
        {vertices.map((v, idx) => {
          const isV0 = idx === 0;
          const isExcludedNeighbor = phase === 'single' && (idx === 1 || idx === sides - 1);
          const isTargetVertex =
            phase === 'single' && !isV0 && !isExcludedNeighbor;

          return (
            <g key={`vertex-group-${idx}`}>
              <circle
                cx={v.x}
                cy={v.y}
                r={isV0 && phase === 'single' ? 8.5 : isTargetVertex ? 7 : 5}
                className={`geo-simple-dot ${isV0 && phase === 'single' ? 'active-dot' : ''}`}
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
        {vertices[0] && (
          <text x={vertices[0].x} y={vertices[0].y - 14} className="geo-pointer-tag vertex-tag">
            ● 꼭짓점
          </text>
        )}
      </svg>

      {/* Dynamic 3B1B Mathematical Caption Box */}
      <div className="geo-level1-caption-box">
        <span className="geo-shape-badge">{sides}각형</span>
        <div className="geo-stat-highlights">
          {phase === 'single' && (
            <span className="geo-stat-item vertex-highlight active-glow">
              1개 꼭짓점 ➔ <strong className="highlight-num">({sides} - 3) = {singleCount}개</strong> 대각선
            </span>
          )}
          {phase === 'all' && (
            <span className="geo-stat-item edge-highlight">
              전체 {sides}개 꼭짓점 ➔ <strong className="highlight-num">{sides} × {singleCount} = {sides * singleCount}개</strong>
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
