import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
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

  const [prevSides, setPrevSides] = useState(4);
  const [currSides, setCurrSides] = useState(4);

  const [phase, setPhase] = useState<
    'morph' | 'single' | 'all' | 'dedup' | 'restore' | 'retract' | 'rest'
  >('morph');
  const [morphProgress, setMorphProgress] = useState(0);
  const [drawProgress, setDrawProgress] = useState(0);
  const [retractProgress, setRetractProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const dragStartXRef = useRef<number | null>(null);

  const animStateRef = useRef<{
    startTime: number | null;
    accumulatedPauseTime: number;
    pauseStart: number | null;
  }>({
    startTime: null,
    accumulatedPauseTime: 0,
    pauseStart: null,
  });

  useEffect(() => {
    animStateRef.current = {
      startTime: null,
      accumulatedPauseTime: 0,
      pauseStart: null,
    };
  }, [currSides]);

  const MORPH_MOTION_DURATION = 1000;
  const MORPH_HOLD_PAUSE = 2000;
  const MORPH_TOTAL_DURATION = MORPH_MOTION_DURATION + MORPH_HOLD_PAUSE;

  const SINGLE_DRAW_DURATION = 1500;
  const SINGLE_HOLD_DURATION = 1500;

  const ALL_DRAW_DURATION = 2500;
  const ALL_HOLD_DURATION = 500;
  const ALL_TOTAL_DURATION = ALL_DRAW_DURATION + ALL_HOLD_DURATION;

  const DEDUP_HIGHLIGHT_DURATION = 3000;
  const DEDUP_RESTORE_DURATION = 1000;

  const RETRACT_DURATION = 1500;
  const FINAL_REST_PAUSE = 1500;

  const TOTAL_CYCLE =
    MORPH_TOTAL_DURATION +
    SINGLE_DRAW_DURATION +
    SINGLE_HOLD_DURATION +
    ALL_TOTAL_DURATION +
    DEDUP_HIGHLIGHT_DURATION +
    DEDUP_RESTORE_DURATION +
    RETRACT_DURATION +
    FINAL_REST_PAUSE;

  useEffect(() => {
    let animId: number;

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

      if (elapsed < MORPH_MOTION_DURATION) {
        const rawU = elapsed / MORPH_MOTION_DURATION;
        const easedU = rawU * rawU * (3 - 2 * rawU);
        setPhase('morph');
        setMorphProgress(easedU);
        setDrawProgress(0);
        setRetractProgress(0);
      } else if (elapsed < MORPH_TOTAL_DURATION) {
        setPhase('morph');
        setMorphProgress(1);
        setDrawProgress(0);
        setRetractProgress(0);
      } else if (elapsed < MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION + SINGLE_HOLD_DURATION) {
        setPhase('single');
        setMorphProgress(1);
        const singleElapsed = elapsed - MORPH_TOTAL_DURATION;
        const rawU = Math.min(singleElapsed / SINGLE_DRAW_DURATION, 1);
        const easedU = rawU * rawU * (3 - 2 * rawU);
        setDrawProgress(easedU);
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION + SINGLE_HOLD_DURATION + ALL_TOTAL_DURATION
      ) {
        setPhase('all');
        setMorphProgress(1);
        const allElapsed =
          elapsed - (MORPH_TOTAL_DURATION + SINGLE_DRAW_DURATION + SINGLE_HOLD_DURATION);
        const rawU = Math.min(allElapsed / ALL_DRAW_DURATION, 1);
        const easedU = rawU * rawU * (3 - 2 * rawU);
        setDrawProgress(easedU);
        setRetractProgress(0);
      } else if (
        elapsed <
        MORPH_TOTAL_DURATION +
          SINGLE_DRAW_DURATION +
          SINGLE_HOLD_DURATION +
          ALL_TOTAL_DURATION +
          DEDUP_HIGHLIGHT_DURATION
      ) {
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
        const easedU = rawU * rawU * (3 - 2 * rawU);
        setRetractProgress(easedU);
      } else if (elapsed < TOTAL_CYCLE) {
        setPhase('rest');
        setMorphProgress(1);
        setDrawProgress(1);
        setRetractProgress(1);
      } else {
        triggerStepChange('next');
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [currSides]);

  // Swipe / Skip Transition Engine (Continuous Seamless Morphing)
  const triggerStepChange = (direction: 'next' | 'prev') => {
    const nextSides =
      direction === 'next'
        ? currSides === 8
          ? 4
          : currSides + 1
        : currSides === 4
          ? 8
          : currSides - 1;

    setPrevSides(currSides);
    setCurrSides(nextSides);
    setPhase('morph');
    setMorphProgress(0);
    setDrawProgress(0);
    setRetractProgress(0);

    const state = animStateRef.current;
    state.startTime = null;
    state.accumulatedPauseTime = 0;
  };

  // Drag Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const dx = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;

    if (Math.abs(dx) > 30) {
      if (dx < 0) {
        // Left Swipe -> Next Shape (Right Direction Split)
        triggerStepChange('next');
      } else {
        // Right Swipe -> Prev Shape (Reverse Shrink Merge)
        triggerStepChange('prev');
      }
    } else {
      setIsPaused((p) => !p);
    }
  };

  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[currSides] || computeRegularVertices(currSides);
    if (morphProgress >= 1 || prevSides === currSides) {
      return targetBase;
    }

    const startBase = PRECOMPUTED_VERTICES[prevSides] || computeRegularVertices(prevSides);

    if (currSides > prevSides) {
      // EXPAND / SPREAD (N -> N+1)
      const initialPoints: { x: number; y: number }[] = [];
      const splitVertexIdx = prevSides === 4 ? 1 : Math.floor(prevSides / 2);
      const cornerPt = startBase[splitVertexIdx % startBase.length] || startBase[0]!;

      for (let i = 0; i < currSides; i++) {
        if (i <= splitVertexIdx) {
          initialPoints.push(startBase[i] || startBase[startBase.length - 1]!);
        } else if (i === splitVertexIdx + 1) {
          initialPoints.push(cornerPt);
        } else {
          const srcIdx = (i - 1) % startBase.length;
          initialPoints.push(startBase[srcIdx] || startBase[0]!);
        }
      }

      return targetBase.map((tPt, i) => {
        const sPt = initialPoints[i] || startBase[0] || tPt;
        return {
          x: sPt.x + (tPt.x - sPt.x) * morphProgress,
          y: sPt.y + (tPt.y - sPt.y) * morphProgress,
        };
      });
    } else {
      // REVERSE PLAYBACK (Reverse Morphing from prevSides -> currSides: e.g. 5 -> 4, 8 -> 4)
      const startSides = currSides; // Target smaller shape (e.g. 4)
      const targetSides = prevSides; // Starting larger shape (e.g. 5 or 8)

      const startBase = PRECOMPUTED_VERTICES[startSides] || computeRegularVertices(startSides);
      const targetBase = PRECOMPUTED_VERTICES[targetSides] || computeRegularVertices(targetSides);

      const initialPoints: { x: number; y: number }[] = [];
      const splitVertexIdx = startSides === 4 ? 1 : Math.floor(startSides / 2);
      const cornerPt = startBase[splitVertexIdx % startBase.length] || startBase[0]!;

      for (let i = 0; i < targetSides; i++) {
        if (i <= splitVertexIdx) {
          initialPoints.push(startBase[i] || startBase[startBase.length - 1]!);
        } else if (i === splitVertexIdx + 1) {
          initialPoints.push(cornerPt);
        } else {
          const srcIdx = (i - 1) % startBase.length;
          initialPoints.push(startBase[srcIdx] || startBase[0]!);
        }
      }

      // Reverse time interpolation: revU = 1 - morphProgress
      const revU = 1 - morphProgress;

      return targetBase.map((target, i) => {
        const start = initialPoints[i] || startBase[0] || target;
        return {
          x: start.x + (target.x - start.x) * revU,
          y: start.y + (target.y - start.y) * revU,
        };
      });
    }
  }, [currSides, prevSides, morphProgress]);

  const activeName = KOREAN_POLYGON_NAMES[currSides] || `${currSides}각형`;

  // Vertex 0 diagonals
  const vertex0Diagonals = useMemo(() => {
    const res: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      fromIdx: number;
      toIdx: number;
    }[] = [];
    const pts = morphPts;
    const n = pts.length;
    for (let j = 2; j < n - 1; j++) {
      res.push({
        x1: pts[0]!.x,
        y1: pts[0]!.y,
        x2: pts[j]!.x,
        y2: pts[j]!.y,
        fromIdx: 0,
        toIdx: j,
      });
    }
    return res;
  }, [morphPts]);

  // All unique diagonals
  const uniqueDiagonals = useMemo(() => {
    const res: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      fromIdx: number;
      toIdx: number;
    }[] = [];
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
          fromIdx: i,
          toIdx: j,
        });
      }
    }
    return res;
  }, [morphPts]);

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

  const caption = (
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
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'pan-y', userSelect: 'none' }}
    >
      <ManimCardLayout
        badgeName={activeName}
        isPaused={isPaused}
        onTogglePause={() => {}}
        captionContent={caption}
      >
        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          <polygon points={ptsStr} className="geo-shape-poly-morph" />

          {/* Outer Edges */}
          {morphPts.map((p, idx) => {
            const nextV = morphPts[(idx + 1) % morphPts.length]!;
            return (
              <line
                key={`edge-${idx}`}
                x1={p.x}
                y1={p.y}
                x2={nextV.x}
                y2={nextV.y}
                className="geo-edge-animated-line"
              />
            );
          })}

          {/* Phase 1: Diagonals from Vertex 0 */}
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
                const midX = (d.x1 + d.x2) / 2;
                const midY = (d.y1 + d.y2) / 2;

                const seg1StartX = midX + (d.x1 - midX) * retractProgress;
                const seg1StartY = midY + (d.y1 - midY) * retractProgress;

                const seg2StartX = midX + (d.x2 - midX) * retractProgress;
                const seg2StartY = midY + (d.y2 - midY) * retractProgress;

                return (
                  <g key={`retract-diag-${idx}`}>
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
            const isTargetVertex = phase === 'single' && !isV0 && !isExcludedNeighbor;

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

          {isAdminMode && <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="#c084fc" />}
        </svg>
      </ManimCardLayout>
    </div>
  );
});
