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

// Korean polygon names dictionary for pure text badge
const KOREAN_POLYGON_NAMES: Record<number, string> = {
  3: '삼각형',
  4: '사각형',
  5: '오각형',
  6: '육각형',
  7: '칠각형',
  8: '팔각형',
};

// Pre-calculate fixed regular polygon vertices for 4, 5, 6, 7, 8 sides
const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  4: computeRegularVertices(4),
  5: computeRegularVertices(5),
  6: computeRegularVertices(6),
  7: computeRegularVertices(7),
  8: computeRegularVertices(8),
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
  const [prevSides, setPrevSides] = useState(4);
  const [currSides, setCurrSides] = useState(4);

  const [phase, setPhase] = useState<'morph' | 'single' | 'all' | 'dedup' | 'restore' | 'retract' | 'rest'>('morph');
  const [morphProgress, setMorphProgress] = useState(0);
  const [drawProgress, setDrawProgress] = useState(0);
  const [retractProgress, setRetractProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = React.useRef(isPaused);
  isPausedRef.current = isPaused;

  const animStateRef = React.useRef<{
    startTime: number | null;
    accumulatedPauseTime: number;
    pauseStart: number | null;
  }>({
    startTime: null,
    accumulatedPauseTime: 0,
    pauseStart: null,
  });

  // Reset anim state on shape index change
  useEffect(() => {
    animStateRef.current = {
      startTime: null,
      accumulatedPauseTime: 0,
      pauseStart: null,
    };
  }, [currSides]);

  // Master rAF Loop for 5-phase timeline
  useEffect(() => {
    let animId: number;
    const MORPH_ANIM_DURATION = 1000; // 1.0s Morphing Motion
    const MORPH_HOLD_DURATION = 2000; // 2.0s Rest Hold Pause after Morphing (Phase 0 total = 3.0s!)
    const MORPH_TOTAL_DURATION = MORPH_ANIM_DURATION + MORPH_HOLD_DURATION;

    const SINGLE_DRAW_DURATION = 1500; // 1.5s Single Vertex Diagonals Motion
    const SINGLE_HOLD_DURATION = 1500; // 1.5s Rest Hold Pause (Phase 1 total = 3.0s)

    const ALL_DRAW_DURATION = 2500; // 2.5s All Vertices Diagonals Motion
    const ALL_HOLD_DURATION = 500; // 0.5s Rest Hold Pause after All Diagonals (Phase 2 total = 3.0s)
    const ALL_TOTAL_DURATION = ALL_DRAW_DURATION + ALL_HOLD_DURATION;

    const DEDUP_HIGHLIGHT_DURATION = 3000; // 3.0s Gold Dedup Highlight (Full 3.0s Gold Glow)
    const DEDUP_RESTORE_DURATION = 1000; // 1.0s Color Restore to Red (Total 4.0s Phase 3)

    const RETRACT_DURATION = 1500; // 1.5s Center-Split Retraction Motion
    const REST_PAUSE_DURATION = 1500; // 1.5s Final Rest Pause (Phase 4 total = 3.0s)

    const TOTAL_CYCLE =
      MORPH_TOTAL_DURATION +
      SINGLE_DRAW_DURATION +
      SINGLE_HOLD_DURATION +
      ALL_TOTAL_DURATION +
      DEDUP_HIGHLIGHT_DURATION +
      DEDUP_RESTORE_DURATION +
      RETRACT_DURATION +
      REST_PAUSE_DURATION;

    const tick = (now: number) => {
      const state = animStateRef.current;

      if (isPausedRef.current) {
        if (!state.pauseStart) state.pauseStart = now;
        animId = requestAnimationFrame(tick);
        return;
      }

      if (state.pauseStart) {
        state.accumulatedPauseTime += now - state.pauseStart;
        state.pauseStart = null;
      }

      if (state.startTime === null) state.startTime = now;
      const elapsed = now - state.startTime - state.accumulatedPauseTime;

      if (elapsed < MORPH_ANIM_DURATION) {
        // Phase 0-a: Morphing Motion (0s ~ 1.0s)
        setPhase('morph');
        const rawT = elapsed / MORPH_ANIM_DURATION;
        const eased =
          rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
        setMorphProgress(eased);
        setDrawProgress(0);
        setRetractProgress(0);
      } else if (elapsed < MORPH_TOTAL_DURATION) {
        // Phase 0-b: 0.5s Rest Hold Pause after Morphing completes (1.0s ~ 1.5s)
        setPhase('morph');
        setMorphProgress(1);
        setDrawProgress(0);
        setRetractProgress(0);
      } else if (elapsed < MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION) {
        // Phase 1-a: Draw (n-3) diagonals from V0 (1.5s ~ 3.0s)
        setPhase('single');
        setMorphProgress(1);
        setDrawProgress(
          Math.min((elapsed - MORPH_TOTAL_DURATION) / SINGLE_DRAW_DURATION, 1)
        );
        setRetractProgress(0);
      } else if (elapsed < MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION + SINGLE_HOLD_DURATION) {
        // Phase 1-b: 1.5s Rest Hold Pause after single-vertex diagonals complete (3.0s ~ 4.5s)
        setPhase('single');
        setMorphProgress(1);
        setDrawProgress(1);
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION + SINGLE_HOLD_DURATION + ALL_DRAW_DURATION
      ) {
        // Phase 2-a: Draw all diagonals motion (4.5s ~ 7.0s)
        setPhase('all');
        setMorphProgress(1);
        setDrawProgress(
          Math.min(
            (elapsed - MORPH_TOTAL_DURATION - SINGLE_DRAW_DURATION - SINGLE_HOLD_DURATION) /
              ALL_DRAW_DURATION,
            1
          )
        );
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION + SINGLE_HOLD_DURATION + ALL_TOTAL_DURATION
      ) {
        // Phase 2-b: 0.5s Rest Hold Pause after all diagonals complete (7.0s ~ 7.5s)
        setPhase('all');
        setMorphProgress(1);
        setDrawProgress(1);
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION +
          SINGLE_DRAW_DURATION +
          SINGLE_HOLD_DURATION +
          ALL_TOTAL_DURATION +
          DEDUP_HIGHLIGHT_DURATION
      ) {
        // Phase 3-a: Deduplication highlight (Gold) (7.5s ~ 9.5s)
        setPhase('dedup');
        setMorphProgress(1);
        setDrawProgress(1);
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION +
          SINGLE_DRAW_DURATION +
          SINGLE_HOLD_DURATION +
          ALL_TOTAL_DURATION +
          DEDUP_HIGHLIGHT_DURATION +
          DEDUP_RESTORE_DURATION
      ) {
        // Phase 3-b: Restore from Gold back to original Red (9.5s ~ 10.5s)
        setPhase('restore');
        setMorphProgress(1);
        setDrawProgress(1);
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION +
          SINGLE_DRAW_DURATION +
          SINGLE_HOLD_DURATION +
          ALL_TOTAL_DURATION +
          DEDUP_HIGHLIGHT_DURATION +
          DEDUP_RESTORE_DURATION +
          RETRACT_DURATION
      ) {
        // Phase 4-a: Center-Split Retraction Motion (10.5s ~ 12.0s)
        setPhase('retract');
        setMorphProgress(1);
        setDrawProgress(1);
        const retractElapsed =
          elapsed -
          (MORPH_TOTAL_DURATION +
            SINGLE_DRAW_DURATION +
            SINGLE_HOLD_DURATION +
            ALL_TOTAL_DURATION +
            DEDUP_HIGHLIGHT_DURATION +
            DEDUP_RESTORE_DURATION);
        const rawU = Math.min(retractElapsed / RETRACT_DURATION, 1);
        const easedU = rawU * rawU * (3 - 2 * rawU); // Smoothstep curve
        setRetractProgress(easedU);
      } else if (elapsed < TOTAL_CYCLE) {
        // Phase 4-b: Final Rest Pause (12.0s ~ 13.5s)
        setPhase('rest');
        setMorphProgress(1);
        setDrawProgress(1);
        setRetractProgress(1);
      } else {
        // Synchronously advance to next shape in 4 -> 5 -> 6 -> 7 -> 8 -> 4 sequence
        const nextSides = currSides === 8 ? 4 : currSides + 1;
        setPrevSides(currSides);
        setCurrSides(nextSides);
        setPhase('morph');
        setMorphProgress(0);
        setDrawProgress(0);
        setRetractProgress(0);
        state.startTime = now;
        state.accumulatedPauseTime = 0;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [currSides]);

  // Memoized Morph Points (Smooth Interpolation for 4 -> 5 -> 6 -> 7 -> 8 -> 4)
  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[currSides] || computeRegularVertices(currSides);
    if (morphProgress >= 1 || prevSides === currSides) {
      return targetBase;
    }

    const startBase = PRECOMPUTED_VERTICES[prevSides] || computeRegularVertices(prevSides);

    if (currSides > prevSides) {
      // SPREAD / EXPAND MORPH (e.g. 4 -> 5, 5 -> 6, 6 -> 7, 7 -> 8)
      const initialPoints: { x: number; y: number }[] = [];
      for (let i = 0; i < currSides; i++) {
        const srcIdx = Math.min(i, startBase.length - 1);
        initialPoints.push(startBase[srcIdx]!);
      }

      return targetBase.map((tPt, i) => {
        const sPt = initialPoints[i]!;
        return {
          x: sPt.x + (tPt.x - sPt.x) * morphProgress,
          y: sPt.y + (tPt.y - sPt.y) * morphProgress,
        };
      });
    } else {
      // CONTRACT MORPH (e.g. 8 -> 4)
      return targetBase.map((tPt, i) => {
        const sPt = startBase[i % startBase.length]!;
        return {
          x: sPt.x + (tPt.x - sPt.x) * morphProgress,
          y: sPt.y + (tPt.y - sPt.y) * morphProgress,
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

  const totalDiagonals = (currSides * (currSides - 3)) / 2;
  const singleCount = currSides - 3;

  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  const textKey = useMemo(() => {
    if (phase === 'single') return `single-${currSides}`;
    if (phase === 'all') return `all-${currSides}`;
    if (phase === 'dedup') return `dedup-${currSides}`;
    return `base-${currSides}`;
  }, [phase, currSides]);

  return (
    <div
      className="geo-level1-wrapper"
      onClick={() => setIsPaused((p) => !p)}
      style={{ cursor: 'pointer', position: 'relative' }}
      title={isPaused ? '클릭/터치하여 애니메이션 재개' : '클릭/터치하여 애니메이션 일시정지'}
    >
      {isPaused && (
        <div className="geo-pause-overlay">
          <span>⏸ 일시정지됨 (터치하여 계속)</span>
        </div>
      )}

      {/* Top Left Badge: Polygon Sides (Purple Pill Badge) */}
      <div style={{ position: 'absolute', top: 8, left: 12, zIndex: 5 }}>
        <span className="geo-shape-badge">
          <span key={currSides} className="geo-text-mode-1">
            {KOREAN_POLYGON_NAMES[currSides] || `${currSides}각형`}
          </span>
        </span>
      </div>

      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
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
        {morphProgress >= 1 &&
          (phase === 'single' || phase === 'all') &&
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

        {/* Phase 2, 3, 3.5 & Retract: All Unique Diagonals */}
        {morphProgress >= 1 &&
          (phase === 'all' || phase === 'dedup' || phase === 'restore' || phase === 'retract') &&
          uniqueDiagonals.map((d, idx) => {
            if (phase === 'retract') {
              // Center-Split Retraction Motion: Split at midpoint and shrink back to respective endpoints
              const midX = (d.x1 + d.x2) / 2;
              const midY = (d.y1 + d.y2) / 2;

              // Retracting segment 1: Shrinks from Midpoint -> Endpoint 1 (d.x1, d.y1)
              const seg1StartX = midX + (d.x1 - midX) * retractProgress;
              const seg1StartY = midY + (d.y1 - midY) * retractProgress;

              // Retracting segment 2: Shrinks from Midpoint -> Endpoint 2 (d.x2, d.y2)
              const seg2StartX = midX + (d.x2 - midX) * retractProgress;
              const seg2StartY = midY + (d.y2 - midY) * retractProgress;

              return (
                <g key={`retract-diag-${idx}`}>
                  {/* Half 1: Midpoint to Point 1 */}
                  <line
                    x1={seg1StartX}
                    y1={seg1StartY}
                    x2={d.x1}
                    y2={d.y1}
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    opacity={1 - retractProgress * 0.85}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.6))' }}
                  />
                  {/* Half 2: Midpoint to Point 2 */}
                  <line
                    x1={seg2StartX}
                    y1={seg2StartY}
                    x2={d.x2}
                    y2={d.y2}
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    opacity={1 - retractProgress * 0.85}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.6))' }}
                  />
                </g>
              );
            }

            // Normal drawing / dedup / restore phases
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
                  transition: 'stroke 0.4s ease, stroke-width 0.4s ease, filter 0.4s ease',
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
      <div className="geo-level1-caption-box" style={{ justifyContent: 'center' }}>
        <div key={textKey} className="geo-stat-highlights geo-text-mode-1">
          {(phase === 'morph' || phase === 'restore' || phase === 'retract' || phase === 'rest') && (
            <>
              <span className="geo-stat-item vertex-highlight">
                꼭짓점{' '}
                <strong key={`v-${currSides}`} className="highlight-num geo-text-mode-1">
                  {currSides}
                </strong>
                개
              </span>
              <span className="geo-divider">/</span>
              <span className="geo-stat-item edge-highlight">
                변{' '}
                <strong key={`e-${currSides}`} className="highlight-num geo-text-mode-1">
                  {currSides}
                </strong>
                개
              </span>
            </>
          )}
          {phase === 'single' && (
            <span className="geo-stat-item vertex-highlight active-glow">
              1개 꼭짓점 ➔{' '}
              <strong key={`s-${currSides}`} className="highlight-num geo-text-mode-1">
                ({currSides} - 3) = {singleCount}개
              </strong>{' '}
              대각선
            </span>
          )}
          {phase === 'all' && (
            <span className="geo-stat-item edge-highlight">
              전체 {currSides}개 꼭짓점 ➔{' '}
              <strong key={`a-${currSides}`} className="highlight-num geo-text-mode-1">
                {currSides} × {singleCount} = {currSides * singleCount}개
              </strong>
            </span>
          )}
          {phase === 'dedup' && (
            <span className="geo-stat-item vertex-highlight active-glow" style={{ color: '#fbbf24' }}>
              2번씩 중복(÷2) ➔ 총{' '}
              <strong key={`d-${currSides}`} className="highlight-num geo-text-mode-1">
                {totalDiagonals}개
              </strong>{' '}
              대각선
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
