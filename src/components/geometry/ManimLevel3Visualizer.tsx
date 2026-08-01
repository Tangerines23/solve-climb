import React, { useState, useEffect, useMemo } from 'react';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

interface TriangleKeyframe {
  v0: Point;
  name: string;
}

// 6 Mathematically Significant Triangle Keyframes (Fixed V1=(40,145), V2=(160,145))
const TRIANGLE_KEYFRAMES: TriangleKeyframe[] = [
  // 1. Equilateral Triangle (정삼각형: 60°, 60°, 60°)
  { v0: { x: 100, y: 41.1 }, name: '정삼각형' },

  // 2. Right Isosceles Triangle (직각이등변삼각형: 90°, 45°, 45°)
  { v0: { x: 100, y: 85.0 }, name: '직각이등변삼각형' },

  // 3. Right Scalene Triangle (직각삼각형: 90°, 53°, 37°)
  { v0: { x: 40, y: 55.0 }, name: '직각삼각형' },

  // 4. Obtuse Isosceles Triangle (둔각이등변삼각형: 120°, 30°, 30°)
  { v0: { x: 100, y: 110.4 }, name: '둔각이등변삼각형' },

  // 5. Obtuse Scalene Triangle (둔각부등변삼각형: 110°, 25°, 45°)
  { v0: { x: 60, y: 65.0 }, name: '둔각부등변삼각형' },

  // 6. Acute Isosceles Triangle (예각이등변삼각형: 40°, 70°, 70°)
  { v0: { x: 100, y: 20.0 }, name: '예각이등변삼각형' },
];

// Timeline parameters: 1.5s Hold at target, 1.0s Transition to next target
const HOLD_DURATION = 1500;
const MOVE_DURATION = 1000;
const STEP_DURATION = HOLD_DURATION + MOVE_DURATION; // 2.5s per keyframe
const TOTAL_CYCLE = TRIANGLE_KEYFRAMES.length * STEP_DURATION; // 15.0s total cycle

export const ManimLevel3Visualizer: React.FC = React.memo(() => {
  const [t, setT] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Single Master rAF loop for keyframe hold & transition sequence
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    let accumulatedPauseTime = 0;
    let pauseStart: number | null = null;

    const tick = (now: number) => {
      if (isPaused) {
        if (!pauseStart) pauseStart = now;
        animId = requestAnimationFrame(tick);
        return;
      }

      if (pauseStart) {
        accumulatedPauseTime += now - pauseStart;
        pauseStart = null;
      }

      if (!startTime) startTime = now;
      const elapsed = (now - startTime - accumulatedPauseTime) % TOTAL_CYCLE;
      setT(elapsed / TOTAL_CYCLE);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  // Compute V0(x, y) with 1.5s Hold Pause and 1.0s Eased Move
  const v0: Point = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % TRIANGLE_KEYFRAMES.length;
    const stepElapsed = elapsedMs % STEP_DURATION;

    const currentTarget = TRIANGLE_KEYFRAMES[stepIndex]!.v0;
    const nextTarget = TRIANGLE_KEYFRAMES[(stepIndex + 1) % TRIANGLE_KEYFRAMES.length]!.v0;

    if (stepElapsed < HOLD_DURATION) {
      // Phase 1: Hold Pause (1.5s) at current target position - NUMBERS ARE STABLE & STILL!
      return currentTarget;
    } else {
      // Phase 2: Smooth Transition (1.0s) to next target position using smoothstep curve
      const moveProgress = (stepElapsed - HOLD_DURATION) / MOVE_DURATION;
      const rawT = Math.min(1, Math.max(0, moveProgress));
      const eased = rawT * rawT * (3 - 2 * rawT);

      return {
        x: currentTarget.x + (nextTarget.x - currentTarget.x) * eased,
        y: currentTarget.y + (nextTarget.y - currentTarget.y) * eased,
      };
    }
  }, [t]);

  const currentName = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % TRIANGLE_KEYFRAMES.length;
    return TRIANGLE_KEYFRAMES[stepIndex]!.name;
  }, [t]);

  // Fixed bottom left (V1) and bottom right (V2)
  const v1: Point = useMemo(() => ({ x: 40, y: 145 }), []);
  const v2: Point = useMemo(() => ({ x: 160, y: 145 }), []);

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

        <text
          x={v1.x + 14}
          y={v1.y - 8}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="start"
          style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }}
        >
          β {betaDeg}°
        </text>

        <text
          x={v2.x - 14}
          y={v2.y - 8}
          fontSize={11}
          fontWeight={800}
          fill="#fbbf24"
          textAnchor="end"
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
