import React, { useState, useEffect, useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface RectKeyframe {
  cols: number; // 가로 칸 수 (e.g. 6)
  rows: number; // 세로 칸 수 (e.g. 4)
  name: string;
}

// 4 Representative Grid Dimensions in 3B1B Sequence
const RECT_KEYFRAMES: RectKeyframe[] = [
  // 1. 6 x 4 Rectangle (Area = 24)
  { cols: 6, rows: 4, name: '직사각형' },
  // 2. 5 x 5 Square (Area = 25)
  { cols: 5, rows: 5, name: '정사각형' },
  // 3. 8 x 3 Wide Rectangle (Area = 24)
  { cols: 8, rows: 3, name: '직사각형' },
  // 4. 4 x 6 Tall Rectangle (Area = 24)
  { cols: 4, rows: 6, name: '직사각형' },
];

// Timeline parameters: 2.0s Hold at target, 1.0s Transition to next target
const HOLD_DURATION = 2000;
const MOVE_DURATION = 1000;
const STEP_DURATION = HOLD_DURATION + MOVE_DURATION; // 3.0s per keyframe
const TOTAL_CYCLE = RECT_KEYFRAMES.length * STEP_DURATION; // 12.0s total cycle

export const ManimLevel5Visualizer: React.FC = React.memo(() => {
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

  // Interpolate cols & rows with Eased Transition
  const currentDimensions = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % RECT_KEYFRAMES.length;
    const stepElapsed = elapsedMs % STEP_DURATION;

    const currFrame = RECT_KEYFRAMES[stepIndex]!;
    const nextFrame = RECT_KEYFRAMES[(stepIndex + 1) % RECT_KEYFRAMES.length]!;

    if (stepElapsed < HOLD_DURATION) {
      return { cols: currFrame.cols, rows: currFrame.rows };
    } else {
      const moveProgress = (stepElapsed - HOLD_DURATION) / MOVE_DURATION;
      const rawT = Math.min(1, Math.max(0, moveProgress));
      const eased = rawT * rawT * (3 - 2 * rawT);

      return {
        cols: currFrame.cols + (nextFrame.cols - currFrame.cols) * eased,
        rows: currFrame.rows + (nextFrame.rows - currFrame.rows) * eased,
      };
    }
  }, [t]);

  const { cols, rows } = currentDimensions;

  const currentName = useMemo(() => {
    const elapsedMs = t * TOTAL_CYCLE;
    const stepIndex = Math.floor(elapsedMs / STEP_DURATION) % RECT_KEYFRAMES.length;
    return RECT_KEYFRAMES[stepIndex]!.name;
  }, [t]);

  // SVG Drawing calculations
  // Unit size per grid cell = 18px
  const cellPixel = 18;
  const widthPx = cols * cellPixel;
  const heightPx = rows * cellPixel;

  const rectX = (SIZE - widthPx) / 2;
  const rectY = 48 + (100 - heightPx) / 2; // Center inside SVG area

  const roundedCols = Math.round(cols);
  const roundedRows = Math.round(rows);
  const area = roundedCols * roundedRows;

  // Grid line generators
  const vertGridLines = useMemo(() => {
    const lines: number[] = [];
    const intCols = Math.floor(cols);
    for (let i = 1; i < intCols; i++) {
      lines.push(rectX + i * cellPixel);
    }
    return lines;
  }, [cols, rectX]);

  const horizGridLines = useMemo(() => {
    const lines: number[] = [];
    const intRows = Math.floor(rows);
    for (let j = 1; j < intRows; j++) {
      lines.push(rectY + j * cellPixel);
    }
    return lines;
  }, [rows, rectY]);

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

      {/* Top Left Badge: Shape Name (Purple Pill Badge) */}
      <div style={{ position: 'absolute', top: 3, left: 4, zIndex: 5 }}>
        <span className="geo-shape-badge">
          <span key={currentName} className="geo-text-mode-1">
            {currentName}
          </span>
        </span>
      </div>

      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Fill Rectangle */}
        <rect
          x={rectX}
          y={rectY}
          width={widthPx}
          height={heightPx}
          className="geo-shape-poly-morph"
          rx={4}
          ry={4}
        />

        {/* 3B1B Unit Grid Overlay Lines */}
        {vertGridLines.map((x, idx) => (
          <line
            key={`v-grid-${idx}`}
            x1={x}
            y1={rectY}
            x2={x}
            y2={rectY + heightPx}
            stroke="rgba(165, 180, 252, 0.4)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        ))}

        {horizGridLines.map((y, idx) => (
          <line
            key={`h-grid-${idx}`}
            x1={rectX}
            y1={y}
            x2={rectX + widthPx}
            y2={y}
            stroke="rgba(165, 180, 252, 0.4)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        ))}

        {/* Outer Boundary Highlight */}
        <rect
          x={rectX}
          y={rectY}
          width={widthPx}
          height={heightPx}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          rx={4}
          ry={4}
        />

        {/* Dimension Indicators: Width (Top) */}
        <line
          x1={rectX}
          y1={rectY - 12}
          x2={rectX + widthPx}
          y2={rectY - 12}
          stroke="#38bdf8"
          strokeWidth={2}
        />
        <line x1={rectX} y1={rectY - 16} x2={rectX} y2={rectY - 8} stroke="#38bdf8" strokeWidth={1.5} />
        <line
          x1={rectX + widthPx}
          y1={rectY - 16}
          x2={rectX + widthPx}
          y2={rectY - 8}
          stroke="#38bdf8"
          strokeWidth={1.5}
        />
        <text
          x={rectX + widthPx / 2}
          y={rectY - 18}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="middle"
        >
          가로 {roundedCols}
        </text>

        {/* Dimension Indicators: Height (Right) */}
        <line
          x1={rectX + widthPx + 12}
          y1={rectY}
          x2={rectX + widthPx + 12}
          y2={rectY + heightPx}
          stroke="#fb7185"
          strokeWidth={2}
        />
        <line
          x1={rectX + widthPx + 8}
          y1={rectY}
          x2={rectX + widthPx + 16}
          y2={rectY}
          stroke="#fb7185"
          strokeWidth={1.5}
        />
        <line
          x1={rectX + widthPx + 8}
          y1={rectY + heightPx}
          x2={rectX + widthPx + 16}
          y2={rectY + heightPx}
          stroke="#fb7185"
          strokeWidth={1.5}
        />
        <text
          x={rectX + widthPx + 18}
          y={rectY + heightPx / 2 + 4}
          fontSize={11}
          fontWeight={800}
          fill="#fb7185"
          textAnchor="start"
        >
          세로 {roundedRows}
        </text>

        {/* Center Grid Cell Count Badge */}
        <text
          x={rectX + widthPx / 2}
          y={rectY + heightPx / 2 + 4}
          fontSize={13}
          fontWeight={900}
          fill="#ffffff"
          textAnchor="middle"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
        >
          {area}칸
        </text>

        {/* DEV ONLY: Centroid Dot */}
        {isAdminMode && (
          <circle cx={rectX + widthPx / 2} cy={rectY + heightPx / 2} r={3} fill="#c084fc" />
        )}
      </svg>

      {/* Dynamic 3B1B Pure Formula Caption Box */}
      <div className="geo-level1-caption-box" style={{ justifyContent: 'center' }}>
        <div className="geo-stat-highlights">
          <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
            가로 <strong className="highlight-num">{roundedCols}</strong>
          </span>
          <span className="geo-divider">×</span>
          <span className="geo-stat-item" style={{ color: '#fb7185' }}>
            세로 <strong className="highlight-num">{roundedRows}</strong>
          </span>
          <span className="geo-divider">=</span>
          <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
            넓이 <strong className="highlight-num" style={{ color: '#4ade80' }}>{area}</strong>
          </span>
        </div>
      </div>
    </div>
  );
});
