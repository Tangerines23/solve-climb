import React, { useState, useEffect, useMemo } from 'react';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 52;

interface ShapeConfig {
  sides: number;
  name: string;
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  { sides: 3, name: '삼각형' },
  { sides: 4, name: '사각형' },
  { sides: 5, name: '오각형' },
  { sides: 6, name: '육각형' },
];

// Pre-calculate fixed regular polygon vertices for 3, 4, 5, 6 sides (Zero GC overhead)
const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  3: computeRegularVertices(3),
  4: computeRegularVertices(4),
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

export const ManimLevel1Visualizer: React.FC = React.memo(() => {
  const [shapeIdx, setShapeIdx] = useState(0);
  const [prevSides, setPrevSides] = useState(3);
  const [currSides, setCurrSides] = useState(3);
  const [progress, setProgress] = useState(1);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  // Single Master rAF Timeline Loop: Deterministic zero-drift animation engine
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;

    const MORPH_DURATION = 1200; // 1.2s shape split/merge morphing
    const HIGHLIGHT_STEP_DURATION = 650; // 0.65s per dot highlight
    const REST_PAUSE_DURATION = 500; // 0.5s rest pause after highlight ends

    const highlightTotalDuration = currSides * HIGHLIGHT_STEP_DURATION;
    const totalCycleDuration = MORPH_DURATION + highlightTotalDuration + REST_PAUSE_DURATION;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < MORPH_DURATION) {
        // Phase 1: Morphing (0s ~ 1.2s) in pure ALL-OFF state
        const rawT = elapsed / MORPH_DURATION;
        const eased =
          rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        setProgress(eased);
        setHighlightIdx(null);
      } else if (elapsed < MORPH_DURATION + highlightTotalDuration) {
        // Phase 2: Clockwise Highlight (1.2s ~ 1.2s + N*0.65s)
        setProgress(1);
        const highlightElapsed = elapsed - MORPH_DURATION;
        const currentStep = Math.floor(highlightElapsed / HIGHLIGHT_STEP_DURATION);
        setHighlightIdx(Math.min(currentStep, currSides - 1));
      } else {
        // Phase 3: Rest Pause (0.5s) in pure ALL-OFF state
        setProgress(1);
        setHighlightIdx(null);
      }

      if (elapsed < totalCycleDuration) {
        animId = requestAnimationFrame(tick);
      } else {
        // Cycle complete! Synchronously reset progress = 0 in single batch to prevent 1-frame completed shape flickering glitch!
        const nextIdx = (shapeIdx + 1) % SHAPE_CONFIGS.length;
        setPrevSides(SHAPE_CONFIGS[shapeIdx]!.sides);
        setCurrSides(SHAPE_CONFIGS[nextIdx]!.sides);
        setShapeIdx(nextIdx);
        setProgress(0); // Synchronous reset prevents 1-frame completed shape glitch!
        setHighlightIdx(null);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shapeIdx, currSides, prevSides]);

  // Memoized Morph Points computation (Zero unnecessary object allocations)
  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[currSides] || PRECOMPUTED_VERTICES[3]!;
    if (progress >= 1 || prevSides === currSides) {
      return targetBase;
    }

    if (currSides > prevSides) {
      // EXPAND / SPREAD (3 -> 4, 4 -> 5, 5 -> 6)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const initialPoints: { x: number; y: number }[] = [];

      let splitVertexIdx = 1;
      if (prevSides === 3) splitVertexIdx = 1;
      if (prevSides === 4) splitVertexIdx = 2;
      if (prevSides === 5) splitVertexIdx = 2;

      const cornerPt = startBase[splitVertexIdx % prevSides]!;

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
          x: start.x + (target.x - start.x) * progress,
          y: start.y + (target.y - start.y) * progress,
        };
      });
    } else {
      // SHRINK / MERGE (6 -> 3)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const targetTriangle = PRECOMPUTED_VERTICES[currSides]!;

      const targetMap = [
        targetTriangle[0]!,
        targetTriangle[1]!,
        targetTriangle[1]!,
        targetTriangle[2]!,
        targetTriangle[2]!,
        targetTriangle[2]!,
      ];

      return startBase.map((start, i) => {
        const target = targetMap[i] || targetTriangle[2]!;
        return {
          x: start.x + (target.x - start.x) * progress,
          y: start.y + (target.y - start.y) * progress,
        };
      });
    }
  }, [currSides, prevSides, progress]);

  const currentConfig = SHAPE_CONFIGS[shapeIdx] || SHAPE_CONFIGS[0]!;
  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  return (
    <div className="geo-level1-wrapper">
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Main Morphing Polygon */}
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

        {/* Edge Lines */}
        {morphPts.map((p, idx) => {
          const nextP = morphPts[(idx + 1) % morphPts.length]!;
          return (
            <line
              key={`edge-${idx}`}
              x1={p.x}
              y1={p.y}
              x2={nextP.x}
              y2={nextP.y}
              className="geo-edge-animated-line"
            />
          );
        })}

        {/* Simple Vertex Dots with radius scaling */}
        {morphPts.map((p, idx) => {
          // STRICT GUARD: Highlights are ONLY active after morphing completes (progress >= 1)!
          const isHighlighted = progress >= 1 && highlightIdx === idx;
          return (
            <circle
              key={`dot-${idx}`}
              cx={p.x}
              cy={p.y}
              r={isHighlighted ? '8.5' : '5'}
              className={`geo-simple-dot ${isHighlighted ? 'active-dot' : ''}`}
            />
          );
        })}

        {/* Static Labels */}
        {morphPts.length > 0 && (
          <g className="geo-label-pointer">
            <text x={morphPts[0]!.x} y={morphPts[0]!.y - 14} className="geo-pointer-tag vertex-tag">
              ● 꼭짓점(점)
            </text>
            {morphPts.length >= 2 && (
              <text
                x={(morphPts[0]!.x + morphPts[1]!.x) / 2 + 18}
                y={(morphPts[0]!.y + morphPts[1]!.y) / 2}
                className="geo-pointer-tag edge-tag"
              >
                ━ 변(선)
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Bottom Static Caption Box */}
      <div className="geo-level1-caption-box">
        <span key={currentConfig.name} className="geo-shape-badge geo-text-mode-1">
          {currentConfig.name}
        </span>
        <div className="geo-stat-highlights">
          <span
            className={`geo-stat-item vertex-highlight ${
              progress >= 1 && highlightIdx !== null ? 'active-glow' : ''
            }`}
          >
            꼭짓점{' '}
            <strong key={`v-${morphPts.length}`} className="highlight-num geo-text-mode-1">
              {morphPts.length}
            </strong>
            개
          </span>
          <span className="geo-divider">/</span>
          <span className="geo-stat-item edge-highlight">
            변{' '}
            <strong key={`e-${morphPts.length}`} className="highlight-num geo-text-mode-1">
              {morphPts.length}
            </strong>
            개
          </span>
        </div>
      </div>
    </div>
  );
});
