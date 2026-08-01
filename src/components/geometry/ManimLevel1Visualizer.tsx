import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
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

  const [shapeIdx, setShapeIdx] = useState(0);
  const [prevSides, setPrevSides] = useState(3);
  const [currSides, setCurrSides] = useState(3);
  const [progress, setProgress] = useState(0);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

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
  }, [shapeIdx]);

  useEffect(() => {
    let animId: number;
    const MORPH_DURATION = 1200;
    const HIGHLIGHT_STEP_DURATION = 650;
    const REST_PAUSE_DURATION = 500;

    const highlightTotalDuration = currSides * HIGHLIGHT_STEP_DURATION;
    const totalCycleDuration = MORPH_DURATION + highlightTotalDuration + REST_PAUSE_DURATION;

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

      if (elapsed < MORPH_DURATION) {
        const rawT = elapsed / MORPH_DURATION;
        const eased =
          rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
        setProgress(eased);
        setHighlightIdx(null);
      } else if (elapsed < MORPH_DURATION + highlightTotalDuration) {
        setProgress(1);
        const highlightElapsed = elapsed - MORPH_DURATION;
        const currentStep = Math.floor(highlightElapsed / HIGHLIGHT_STEP_DURATION);
        setHighlightIdx(Math.min(currentStep, currSides - 1));
      } else {
        setProgress(1);
        setHighlightIdx(null);
      }

      if (elapsed < totalCycleDuration) {
        animId = requestAnimationFrame(tick);
      } else {
        const nextIdx = (shapeIdx + 1) % SHAPE_CONFIGS.length;
        setPrevSides(SHAPE_CONFIGS[shapeIdx]!.sides);
        setCurrSides(SHAPE_CONFIGS[nextIdx]!.sides);
        setShapeIdx(nextIdx);
        setProgress(0);
        setHighlightIdx(null);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shapeIdx, currSides, prevSides]);

  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[currSides] || PRECOMPUTED_VERTICES[3]!;
    if (progress >= 1 || prevSides === currSides) {
      return targetBase;
    }

    if (currSides > prevSides) {
      // EXPAND / SPREAD (3 -> 4, 4 -> 5, 5 -> 6, 6 -> 7, 7 -> 8)
      // Fixed symmetric split at lower-right corner vertex: Math.floor(prevSides / 2)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const initialPoints: { x: number; y: number }[] = [];

      const splitVertexIdx = Math.floor(prevSides / 2);
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
      // Clockwise Arc / Curved path shrink merge to top vertex
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const targetBase = PRECOMPUTED_VERTICES[currSides]!;
      const topVertex = targetBase[0]!;
      const centerX = SIZE / 2;
      const centerY = SIZE / 2;

      return startBase.map((start, i) => {
        let target = topVertex;
        if (i === 1 && targetBase[1]) {
          target = targetBase[1];
        } else if (i === 2 && targetBase[2]) {
          target = targetBase[2];
        }

        // ALL vertices (including 1 and 2) rotate CLOCKWISE in a circular arc path around center!
        const startAngle = Math.atan2(start.y - centerY, start.x - centerX);
        const targetAngle = Math.atan2(target.y - centerY, target.x - centerX);

        let deltaAngle = targetAngle - startAngle;
        while (deltaAngle < 0) deltaAngle += Math.PI * 2; // Enforce Clockwise Circular Arc

        const startRadius = Math.hypot(start.x - centerX, start.y - centerY);
        const targetRadius = Math.hypot(target.x - centerX, target.y - centerY);

        const currentAngle = startAngle + deltaAngle * progress;
        const currentRadius = startRadius + (targetRadius - startRadius) * progress;

        return {
          x: centerX + currentRadius * Math.cos(currentAngle),
          y: centerY + currentRadius * Math.sin(currentAngle),
        };
      });
    }
  }, [currSides, prevSides, progress]);

  const currentConfig = SHAPE_CONFIGS[shapeIdx] || SHAPE_CONFIGS[0]!;
  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  const caption = (
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
  );

  return (
    <ManimCardLayout
      badgeName={currentConfig.name}
      isPaused={isPaused}
      onTogglePause={() => setIsPaused((p) => !p)}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

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

        {morphPts.map((p, idx) => {
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

        {isAdminMode && <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="#c084fc" />}
      </svg>
    </ManimCardLayout>
  );
});
