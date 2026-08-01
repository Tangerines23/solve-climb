import React, { useState, useEffect, useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

interface TriangleVerticesKeyframe {
  v0: Point;
  v1: Point;
  v2: Point;
  name: string;
}

// Center target for Centroid Delta (δ): Positioned at (100, 96) to leave ample top margin for badge
const CENTER_DELTA: Point = { x: 100, y: 96 };

// Helper function to shift triangle vertices so its centroid aligns EXACTLY at CENTER_DELTA (100, 85)
function centerTriangleAtDelta(v0: Point, v1: Point, v2: Point): { v0: Point; v1: Point; v2: Point } {
  const currentCentroid = {
    x: (v0.x + v1.x + v2.x) / 3,
    y: (v0.y + v1.y + v2.y) / 3,
  };
  const dx = CENTER_DELTA.x - currentCentroid.x;
  const dy = CENTER_DELTA.y - currentCentroid.y;
  return {
    v0: { x: v0.x + dx, y: v0.y + dy },
    v1: { x: v1.x + dx, y: v1.y + dy },
    v2: { x: v2.x + dx, y: v2.y + dy },
  };
}

// 6 Representative Triangle Keyframes centered at Centroid Delta (100, 85)
const RAW_KEYFRAMES = [
  // 1. Equilateral Triangle (정삼각형: 60°, 60°, 60°)
  { v0: { x: 100, y: 41.1 }, v1: { x: 40, y: 145 }, v2: { x: 160, y: 145 }, name: '정삼각형' },

  // 2. Right Isosceles Triangle (직각이등변삼각형: 90°, 45°, 45°)
  { v0: { x: 100, y: 85.0 }, v1: { x: 40, y: 145 }, v2: { x: 160, y: 145 }, name: '직각이등변삼각형' },

  // 3. Right Scalene Triangle (직각삼각형: 90°, 37°, 53° - Right biased to avoid top-left badge)
  { v0: { x: 160, y: 55.0 }, v1: { x: 40, y: 145 }, v2: { x: 160, y: 145 }, name: '직각삼각형' },

  // 4. Obtuse Isosceles Triangle (둔각이등변삼각형: 120°, 30°, 30°)
  { v0: { x: 100, y: 110.4 }, v1: { x: 40, y: 145 }, v2: { x: 160, y: 145 }, name: '둔각이등변삼각형' },

  // 5. Obtuse Scalene Triangle (둔각부등변삼각형: 110°, 45°, 25° - Right biased to avoid top-left badge)
  { v0: { x: 140, y: 65.0 }, v1: { x: 40, y: 145 }, v2: { x: 160, y: 145 }, name: '둔각부등변삼각형' },

  // 6. Acute Isosceles Triangle (예각이등변삼각형: 40°, 70°, 70°)
  { v0: { x: 100, y: 20.0 }, v1: { x: 40, y: 145 }, v2: { x: 160, y: 145 }, name: '예각이등변삼각형' },
];

const TRIANGLE_KEYFRAMES: TriangleVerticesKeyframe[] = RAW_KEYFRAMES.map((kf) => {
  const centered = centerTriangleAtDelta(kf.v0, kf.v1, kf.v2);
  return {
    ...centered,
    name: kf.name,
  };
});

// Timeline parameters: 1.5s Hold at target, 1.0s Transition to next target
const HOLD_DURATION = 1500;
const MOVE_DURATION = 1000;
const STEP_DURATION = HOLD_DURATION + MOVE_DURATION; // 2.5s per keyframe
const TOTAL_CYCLE = TRIANGLE_KEYFRAMES.length * STEP_DURATION; // 15.0s total cycle

export const ManimLevel3Visualizer: React.FC = React.memo(() => {
  const [t, setT] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

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

  // Single Master rAF loop for keyframe hold & transition sequence
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
      const elapsed = (now - state.startTime - state.accumulatedPauseTime) % TOTAL_CYCLE;
      setT(elapsed / TOTAL_CYCLE);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Compute all 3 vertices (v0, v1, v2) with 1.5s Hold Pause and 1.0s Eased Move
  const currentVertices = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % TRIANGLE_KEYFRAMES.length;
    const stepElapsed = elapsedMs % STEP_DURATION;

    const currentKf = TRIANGLE_KEYFRAMES[stepIndex]!;
    const nextKf = TRIANGLE_KEYFRAMES[(stepIndex + 1) % TRIANGLE_KEYFRAMES.length]!;

    if (stepElapsed < HOLD_DURATION) {
      return { v0: currentKf.v0, v1: currentKf.v1, v2: currentKf.v2 };
    } else {
      const moveProgress = (stepElapsed - HOLD_DURATION) / MOVE_DURATION;
      const rawT = Math.min(1, Math.max(0, moveProgress));
      const eased = rawT * rawT * (3 - 2 * rawT);

      return {
        v0: {
          x: currentKf.v0.x + (nextKf.v0.x - currentKf.v0.x) * eased,
          y: currentKf.v0.y + (nextKf.v0.y - currentKf.v0.y) * eased,
        },
        v1: {
          x: currentKf.v1.x + (nextKf.v1.x - currentKf.v1.x) * eased,
          y: currentKf.v1.y + (nextKf.v1.y - currentKf.v1.y) * eased,
        },
        v2: {
          x: currentKf.v2.x + (nextKf.v2.x - currentKf.v2.x) * eased,
          y: currentKf.v2.y + (nextKf.v2.y - currentKf.v2.y) * eased,
        },
      };
    }
  }, [t]);

  const { v0, v1, v2 } = currentVertices;

  const currentName = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % TRIANGLE_KEYFRAMES.length;
    return TRIANGLE_KEYFRAMES[stepIndex]!.name;
  }, [t]);

  // Dynamic Midpoints of opposing sides for 3 medians
  const m0: Point = useMemo(() => ({ x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 }), [v1, v2]); // V1-V2 midpoint
  const m1: Point = useMemo(() => ({ x: (v0.x + v2.x) / 2, y: (v0.y + v2.y) / 2 }), [v0, v2]); // V0-V2 midpoint
  const m2: Point = useMemo(() => ({ x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 }), [v0, v1]); // V0-V1 midpoint

  // Centroid Delta (δ): Exact intersection of all 3 medians, perfectly centered at (100, 85)
  const deltaCentroid: Point = useMemo(
    () => ({
      x: (v0.x + v1.x + v2.x) / 3,
      y: (v0.y + v1.y + v2.y) / 3,
    }),
    [v0, v1, v2]
  );

  // Calculate side lengths
  const a = useMemo(() => Math.hypot(v2.x - v1.x, v2.y - v1.y), [v1, v2]); // side opposite to V0 (bottom)
  const b = useMemo(() => Math.hypot(v2.x - v0.x, v2.y - v0.y), [v0, v2]); // side opposite to V1
  const c = useMemo(() => Math.hypot(v1.x - v0.x, v1.y - v0.y), [v0, v1]); // side opposite to V2

  // Calculate angles in degrees using Law of Cosines
  const alphaDeg = useMemo(() => {
    const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
    return Math.round((Math.acos(cosA) * 180) / Math.PI);
  }, [a, b, c]);

  const betaDeg = useMemo(() => {
    const cosB = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));
    return Math.round((Math.acos(cosB) * 180) / Math.PI);
  }, [a, b, c]);

  // Ensure sum is strictly 180
  const gammaDeg = 180 - alphaDeg - betaDeg;

  // Arc path generator for inner angle visualization
  const getArcPath = (center: Point, p1: Point, p2: Point, radius: number = 22) => {
    const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);

    let diff = a2 - a1;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const startAngle = a1;
    const endAngle = a1 + diff;

    const x1 = center.x + radius * Math.cos(startAngle);
    const y1 = center.y + radius * Math.sin(startAngle);
    const x2 = center.x + radius * Math.cos(endAngle);
    const y2 = center.y + radius * Math.sin(endAngle);

    const sweepFlag = diff > 0 ? 1 : 0;
    const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;

    return `M ${center.x} ${center.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2} Z`;
  };

  const alphaArc = useMemo(() => getArcPath(v0, v1, v2, 24), [v0, v1, v2]);
  const betaArc = useMemo(() => getArcPath(v1, v2, v0, 22), [v0, v1, v2]);
  const gammaArc = useMemo(() => getArcPath(v2, v0, v1, 22), [v0, v1, v2]);

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
      {/* Top Left Badge: Triangle Type (Purple Pill Badge) */}
      <div style={{ position: 'absolute', top: 8, left: 12, zIndex: 5 }}>
        <span className="geo-shape-badge">
          <span key={currentName} className="geo-text-mode-1">
            {currentName}
          </span>
        </span>
      </div>

      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Main Triangle Polygon */}
        <polygon
          points={`${v0.x.toFixed(1)},${v0.y.toFixed(1)} ${v1.x},${v1.y} ${v2.x},${v2.y}`}
          className="geo-shape-poly-morph"
        />

        {/* Inner Angle Arcs */}
        <path d={alphaArc} fill="rgba(251, 113, 133, 0.35)" stroke="#fb7185" strokeWidth={1.5} />
        <path d={betaArc} fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth={1.5} />
        <path d={gammaArc} fill="rgba(251, 191, 36, 0.35)" stroke="#fbbf24" strokeWidth={1.5} />

        {/* Triangle Outer Edges */}
        <line x1={v0.x} y1={v0.y} x2={v1.x} y2={v1.y} className="geo-edge-animated-line" />
        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} className="geo-edge-animated-line" />
        <line x1={v2.x} y1={v2.y} x2={v0.x} y2={v0.y} className="geo-edge-animated-line" />

        {/* Vertex Dots */}
        <circle cx={v0.x} cy={v0.y} r={6} className="geo-simple-dot active-dot" style={{ fill: '#fb7185' }} />
        <circle cx={v1.x} cy={v1.y} r={5.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />
        <circle cx={v2.x} cy={v2.y} r={5.5} className="geo-simple-dot" style={{ fill: '#fbbf24' }} />

        {/* Render 3 Medians and Centroid Delta (δ) ONLY when DEV Admin Mode toggle is ON! */}
        {isAdminMode && (
          <>
            <line
              x1={v0.x}
              y1={v0.y}
              x2={m0.x}
              y2={m0.y}
              stroke="#c084fc"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <line
              x1={v1.x}
              y1={v1.y}
              x2={m1.x}
              y2={m1.y}
              stroke="#c084fc"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <line
              x1={v2.x}
              y1={v2.y}
              x2={m2.x}
              y2={m2.y}
              stroke="#c084fc"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.7}
            />

            {/* Centroid Delta (δ) Intersection Dot */}
            <circle
              cx={deltaCentroid.x}
              cy={deltaCentroid.y}
              r={4.5}
              fill="#c084fc"
              stroke="#ffffff"
              strokeWidth={1.2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(192, 132, 252, 0.8))' }}
            />

            {/* Delta (δ) Centroid Label */}
            <text
              x={deltaCentroid.x + 8}
              y={deltaCentroid.y + 4}
              fontSize={10}
              fontWeight={900}
              fill="#c084fc"
              textAnchor="start"
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}
            >
              δ (무게중심)
            </text>
          </>
        )}

        {/* Dynamic Angle Labels near Vertices */}
        <text
          x={v0.x}
          y={v0.y - 12}
          fontSize={11}
          fontWeight={800}
          fill="#fb7185"
          textAnchor="middle"
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}
        >
          α {alphaDeg}°
        </text>

        {/* Beta Label: Positioned Below Left Vertex V1 */}
        <text
          x={v1.x - 6}
          y={v1.y + 14}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="end"
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}
        >
          β {betaDeg}°
        </text>

        {/* Gamma Label: Positioned Below Right Vertex V2 */}
        <text
          x={v2.x + 6}
          y={v2.y + 14}
          fontSize={11}
          fontWeight={800}
          fill="#fbbf24"
          textAnchor="start"
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}
        >
          γ {gammaDeg}°
        </text>
      </svg>

      {/* Dynamic Pure Formula Caption Box */}
      <div className="geo-level1-caption-box" style={{ justifyContent: 'center' }}>
        <div className="geo-stat-highlights">
          <span className="geo-stat-item" style={{ color: '#fb7185' }}>
            α <strong className="highlight-num">{alphaDeg}°</strong>
          </span>
          <span className="geo-divider">+</span>
          <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
            β <strong className="highlight-num">{betaDeg}°</strong>
          </span>
          <span className="geo-divider">+</span>
          <span className="geo-stat-item" style={{ color: '#fbbf24' }}>
            γ <strong className="highlight-num">{gammaDeg}°</strong>
          </span>
          <span className="geo-divider">=</span>
          <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
            180°
          </span>
        </div>
      </div>
    </div>
  );
});
