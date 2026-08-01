import React, { useState, useEffect, useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

interface QuadKeyframe {
  v0: Point; // top-left
  v1: Point; // top-right
  v2: Point; // bottom-right
  v3: Point; // bottom-left
  name: string;
}

// 4 Representative Quadrilateral Keyframes in 3B1B Sequence
const QUAD_KEYFRAMES: QuadKeyframe[] = [
  // 1. Parallelogram (평행사변형: 110°, 70°, 110°, 70°)
  {
    v0: { x: 65, y: 45 },
    v1: { x: 165, y: 45 },
    v2: { x: 135, y: 135 },
    v3: { x: 35, y: 135 },
    name: '평행사변형',
  },
  // 2. Rectangle (직사각형: 90°, 90°, 90°, 90°)
  {
    v0: { x: 45, y: 45 },
    v1: { x: 155, y: 45 },
    v2: { x: 155, y: 135 },
    v3: { x: 45, y: 135 },
    name: '직사각형',
  },
  // 3. Rhombus (마름모: 120°, 60°, 120°, 60°)
  {
    v0: { x: 100, y: 25 },
    v1: { x: 165, y: 90 },
    v2: { x: 100, y: 155 },
    v3: { x: 35, y: 90 },
    name: '마름모',
  },
  // 4. Square (정사각형: 90°, 90°, 90°, 90°)
  {
    v0: { x: 55, y: 45 },
    v1: { x: 145, y: 45 },
    v2: { x: 145, y: 135 },
    v3: { x: 55, y: 135 },
    name: '정사각형',
  },
];

// Timeline parameters: 2.0s Hold at target, 1.0s Transition to next target
const HOLD_DURATION = 2000;
const MOVE_DURATION = 1000;
const STEP_DURATION = HOLD_DURATION + MOVE_DURATION; // 3.0s per keyframe
const TOTAL_CYCLE = QUAD_KEYFRAMES.length * STEP_DURATION; // 12.0s total cycle

export const ManimLevel4Visualizer: React.FC = React.memo(() => {
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

  // Compute V0, V1, V2, V3 with Hold Pause and Eased Move
  const currentVertices = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % QUAD_KEYFRAMES.length;
    const stepElapsed = elapsedMs % STEP_DURATION;

    const currFrame = QUAD_KEYFRAMES[stepIndex]!;
    const nextFrame = QUAD_KEYFRAMES[(stepIndex + 1) % QUAD_KEYFRAMES.length]!;

    if (stepElapsed < HOLD_DURATION) {
      return { v0: currFrame.v0, v1: currFrame.v1, v2: currFrame.v2, v3: currFrame.v3 };
    } else {
      const moveProgress = (stepElapsed - HOLD_DURATION) / MOVE_DURATION;
      const rawT = Math.min(1, Math.max(0, moveProgress));
      const eased = rawT * rawT * (3 - 2 * rawT);

      return {
        v0: {
          x: currFrame.v0.x + (nextFrame.v0.x - currFrame.v0.x) * eased,
          y: currFrame.v0.y + (nextFrame.v0.y - currFrame.v0.y) * eased,
        },
        v1: {
          x: currFrame.v1.x + (nextFrame.v1.x - currFrame.v1.x) * eased,
          y: currFrame.v1.y + (nextFrame.v1.y - currFrame.v1.y) * eased,
        },
        v2: {
          x: currFrame.v2.x + (nextFrame.v2.x - currFrame.v2.x) * eased,
          y: currFrame.v2.y + (nextFrame.v2.y - currFrame.v2.y) * eased,
        },
        v3: {
          x: currFrame.v3.x + (nextFrame.v3.x - currFrame.v3.x) * eased,
          y: currFrame.v3.y + (nextFrame.v3.y - currFrame.v3.y) * eased,
        },
      };
    }
  }, [t]);

  const { v0, v1, v2, v3 } = currentVertices;

  const currentName = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % QUAD_KEYFRAMES.length;
    return QUAD_KEYFRAMES[stepIndex]!.name;
  }, [t]);

  // Calculate inner angles at v0 and v3
  const angles = useMemo(() => {
    const v01 = { x: v1.x - v0.x, y: v1.y - v0.y };
    const v03 = { x: v3.x - v0.x, y: v3.y - v0.y };

    const dot0 = v01.x * v03.x + v01.y * v03.y;
    const len01 = Math.hypot(v01.x, v01.y);
    const len03 = Math.hypot(v03.x, v03.y);
    const cos0 = Math.max(-1, Math.min(1, dot0 / (len01 * len03)));
    const alpha = Math.round((Math.acos(cos0) * 180) / Math.PI);
    const beta = 180 - alpha;

    return { alphaDeg: alpha, betaDeg: beta };
  }, [v0, v1, v3]);

  const { alphaDeg, betaDeg } = angles;

  // Inner angle arc path generator
  const getArcPath = (center: Point, p1: Point, p2: Point, radius: number = 18) => {
    const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);

    let diff = angle2 - angle1;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const endAngle = angle1 + diff;
    const startX = center.x + radius * Math.cos(angle1);
    const startY = center.y + radius * Math.sin(angle1);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    const sweepFlag = diff > 0 ? 1 : 0;
    return `M ${center.x} ${center.y} L ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY} Z`;
  };

  const arcV0 = useMemo(() => getArcPath(v0, v3, v1), [v0, v3, v1]);
  const arcV1 = useMemo(() => getArcPath(v1, v0, v2), [v1, v0, v2]);
  const arcV2 = useMemo(() => getArcPath(v2, v1, v3), [v2, v1, v3]);
  const arcV3 = useMemo(() => getArcPath(v3, v2, v0), [v3, v2, v0]);

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

      {/* Top Left Badge: Polygon Name (Purple Pill Badge) */}
      <div style={{ position: 'absolute', top: 3, left: 4, zIndex: 5 }}>
        <span className="geo-shape-badge">
          <span key={currentName} className="geo-text-mode-1">
            {currentName}
          </span>
        </span>
      </div>

      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Main Quadrilateral Polygon */}
        <polygon
          points={`${v0.x.toFixed(1)},${v0.y.toFixed(1)} ${v1.x.toFixed(1)},${v1.y.toFixed(1)} ${v2.x.toFixed(1)},${v2.y.toFixed(1)} ${v3.x.toFixed(1)},${v3.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* Opposite Inner Angle Arcs (Alpha & Gamma = Pink, Beta & Delta = Skyblue) */}
        <path d={arcV0} fill="rgba(251, 113, 133, 0.35)" stroke="#fb7185" strokeWidth={1.5} />
        <path d={arcV2} fill="rgba(251, 113, 133, 0.35)" stroke="#fb7185" strokeWidth={1.5} />

        <path d={arcV1} fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth={1.5} />
        <path d={arcV3} fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth={1.5} />

        {/* Outer Edges */}
        <line x1={v0.x} y1={v0.y} x2={v1.x} y2={v1.y} className="geo-edge-animated-line" />
        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} className="geo-edge-animated-line" />
        <line x1={v2.x} y1={v2.y} x2={v3.x} y2={v3.y} className="geo-edge-animated-line" />
        <line x1={v3.x} y1={v3.y} x2={v0.x} y2={v0.y} className="geo-edge-animated-line" />

        {/* Vertex Dots */}
        <circle cx={v0.x} cy={v0.y} r={5.5} className="geo-simple-dot" style={{ fill: '#fb7185' }} />
        <circle cx={v1.x} cy={v1.y} r={5.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />
        <circle cx={v2.x} cy={v2.y} r={5.5} className="geo-simple-dot" style={{ fill: '#fb7185' }} />
        <circle cx={v3.x} cy={v3.y} r={5.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />

        {/* DEV ONLY: Diagonals */}
        {isAdminMode && (
          <>
            <line x1={v0.x} y1={v0.y} x2={v2.x} y2={v2.y} stroke="#c084fc" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.7} />
            <line x1={v1.x} y1={v1.y} x2={v3.x} y2={v3.y} stroke="#c084fc" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.7} />
          </>
        )}

        {/* Angle Labels near Vertices */}
        <text x={v0.x - 10} y={v0.y - 8} fontSize={11} fontWeight={800} fill="#fb7185" textAnchor="end">
          α {alphaDeg}°
        </text>
        <text x={v1.x + 10} y={v1.y - 8} fontSize={11} fontWeight={800} fill="#38bdf8" textAnchor="start">
          β {betaDeg}°
        </text>
        <text x={v2.x + 10} y={v2.y + 16} fontSize={11} fontWeight={800} fill="#fb7185" textAnchor="start">
          γ {alphaDeg}°
        </text>
        <text x={v3.x - 10} y={v3.y + 16} fontSize={11} fontWeight={800} fill="#38bdf8" textAnchor="end">
          δ {betaDeg}°
        </text>
      </svg>

      {/* Dynamic 3B1B Pure Formula Caption Box */}
      <div className="geo-level1-caption-box" style={{ justifyContent: 'center' }}>
        <div className="geo-stat-highlights">
          <span className="geo-stat-item" style={{ color: '#fb7185' }}>
            α <strong className="highlight-num">{alphaDeg}°</strong>
          </span>
          <span className="geo-divider">+</span>
          <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
            β <strong className="highlight-num">{betaDeg}°</strong>
          </span>
          <span className="geo-divider">=</span>
          <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
            180°
          </span>
          <span className="geo-divider">/</span>
          <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
            합 = 360°
          </span>
        </div>
      </div>
    </div>
  );
});
