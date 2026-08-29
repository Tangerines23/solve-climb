import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

interface TriangleKeyframe {
  v0: Point;
  v1: Point;
  v2: Point;
  name: string;
}

const TRIANGLE_KEYFRAMES: TriangleKeyframe[] = [
  { v0: { x: 100, y: 41.54006 }, v1: { x: 42, y: 142 }, v2: { x: 158, y: 142 }, name: '정삼각형' },
  {
    v0: { x: 100, y: 75.0 },
    v1: { x: 35, y: 140 },
    v2: { x: 165, y: 140 },
    name: '직각이등변삼각형',
  },
  { v0: { x: 40, y: 50.0 }, v1: { x: 40, y: 142 }, v2: { x: 162.247, y: 142 }, name: '직각삼각형' },
  {
    v0: { x: 100, y: 88.81198 },
    v1: { x: 20, y: 135 },
    v2: { x: 180, y: 135 },
    name: '둔각이등변삼각형',
  },
  {
    v0: { x: 65, y: 72.0 },
    v1: { x: 18, y: 138 },
    v2: { x: 178, y: 138 },
    name: '둔각부등변삼각형',
  },
  {
    v0: { x: 100, y: 13.1256 },
    v1: { x: 52, y: 145 },
    v2: { x: 148, y: 145 },
    name: '예각이등변삼각형',
  },
];

export const ManimLevel3Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: TRIANGLE_KEYFRAMES.length,
    holdDuration: 1500,
    moveDuration: 1000,
  });

  const currFrame = TRIANGLE_KEYFRAMES[stepIndex]!;
  const nextFrame = TRIANGLE_KEYFRAMES[(stepIndex + 1) % TRIANGLE_KEYFRAMES.length]!;

  const eased = getEasedProgress();

  const v0 = {
    x: currFrame.v0.x + (nextFrame.v0.x - currFrame.v0.x) * eased,
    y: currFrame.v0.y + (nextFrame.v0.y - currFrame.v0.y) * eased,
  };
  const v1 = {
    x: currFrame.v1.x + (nextFrame.v1.x - currFrame.v1.x) * eased,
    y: currFrame.v1.y + (nextFrame.v1.y - currFrame.v1.y) * eased,
  };
  const v2 = {
    x: currFrame.v2.x + (nextFrame.v2.x - currFrame.v2.x) * eased,
    y: currFrame.v2.y + (nextFrame.v2.y - currFrame.v2.y) * eased,
  };

  const currentName = currFrame.name;

  const m0: Point = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
  const m1: Point = { x: (v0.x + v2.x) / 2, y: (v0.y + v2.y) / 2 };
  const m2: Point = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };

  const deltaCentroid: Point = {
    x: (v0.x + v1.x + v2.x) / 3,
    y: (v0.y + v1.y + v2.y) / 3,
  };

  const a = Math.hypot(v2.x - v1.x, v2.y - v1.y);
  const b = Math.hypot(v2.x - v0.x, v2.y - v0.y);
  const c = Math.hypot(v1.x - v0.x, v1.y - v0.y);

  const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
  const cosB = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));
  const cosC = Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b)));

  const exactA = (Math.acos(cosA) * 180) / Math.PI;
  const exactB = (Math.acos(cosB) * 180) / Math.PI;
  const exactC = (Math.acos(cosC) * 180) / Math.PI;

  let roundedA = Math.round(exactA);
  let roundedB = Math.round(exactB);
  let roundedC = Math.round(exactC);

  if (Math.abs(exactB - exactC) < 1.0) {
    const equalBase = Math.round((exactB + exactC) / 2);
    roundedB = equalBase;
    roundedC = equalBase;
    roundedA = 180 - roundedB - roundedC;
  } else if (Math.abs(exactA - exactB) < 1.0) {
    const equalSide = Math.round((exactA + exactB) / 2);
    roundedA = equalSide;
    roundedB = equalSide;
    roundedC = 180 - roundedA - roundedB;
  } else {
    const sum = roundedA + roundedB + roundedC;
    if (sum !== 180) {
      const errA = Math.abs(exactA - roundedA);
      const errB = Math.abs(exactB - roundedB);
      const errC = Math.abs(exactC - roundedC);

      if (errC >= errA && errC >= errB) {
        roundedC = 180 - roundedA - roundedB;
      } else if (errB >= errA && errB >= errC) {
        roundedB = 180 - roundedA - roundedC;
      } else {
        roundedA = 180 - roundedB - roundedC;
      }
    }
  }

  const alphaDeg = roundedA;
  const betaDeg = roundedB;
  const gammaDeg = roundedC;

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

  const alphaArc = getArcPath(v0, v1, v2, 24);
  const betaArc = getArcPath(v1, v2, v0, 22);
  const gammaArc = getArcPath(v2, v0, v1, 22);

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#c084fc' }}>
        α <strong className="highlight-num">{alphaDeg}°</strong>
      </span>
      <span className="geo-divider">+</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        β <strong className="highlight-num">{betaDeg}°</strong>
      </span>
      <span className="geo-divider">+</span>
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        γ <strong className="highlight-num">{gammaDeg}°</strong>
      </span>
      <span className="geo-divider">=</span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        180°
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName={currentName}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon
          points={`${v0.x.toFixed(1)},${v0.y.toFixed(1)} ${v1.x.toFixed(1)},${v1.y.toFixed(1)} ${v2.x.toFixed(1)},${v2.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        <path d={alphaArc} fill="rgba(192, 132, 252, 0.35)" stroke="#c084fc" strokeWidth={1.5} />
        <path d={betaArc} fill="rgba(251, 113, 133, 0.35)" stroke="#fb7185" strokeWidth={1.5} />
        <path d={gammaArc} fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth={1.5} />

        <line x1={v0.x} y1={v0.y} x2={v1.x} y2={v1.y} className="geo-edge-animated-line" />
        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} className="geo-edge-animated-line" />
        <line x1={v2.x} y1={v2.y} x2={v0.x} y2={v0.y} className="geo-edge-animated-line" />

        {isAdminMode && (
          <>
            <line
              x1={v0.x}
              y1={v0.y}
              x2={m0.x}
              y2={m0.y}
              stroke="#e2e8f0"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />
            <line
              x1={v1.x}
              y1={v1.y}
              x2={m1.x}
              y2={m1.y}
              stroke="#e2e8f0"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />
            <line
              x1={v2.x}
              y1={v2.y}
              x2={m2.x}
              y2={m2.y}
              stroke="#e2e8f0"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />

            <circle cx={m0.x} cy={m0.y} r={2.5} fill="#a5b4fc" />
            <circle cx={m1.x} cy={m1.y} r={2.5} fill="#a5b4fc" />
            <circle cx={m2.x} cy={m2.y} r={2.5} fill="#a5b4fc" />

            <circle
              cx={deltaCentroid.x}
              cy={deltaCentroid.y}
              r={4.5}
              fill="#facc15"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <text
              x={deltaCentroid.x + 7}
              y={deltaCentroid.y - 5}
              fontSize={10}
              fontWeight={800}
              fill="#facc15"
            >
              δ
            </text>
          </>
        )}

        <circle
          cx={v0.x}
          cy={v0.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#c084fc' }}
        />
        <circle
          cx={v1.x}
          cy={v1.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#fb7185' }}
        />
        <circle
          cx={v2.x}
          cy={v2.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />

        <text
          x={v0.x}
          y={v0.y - 10}
          fontSize={12}
          fontWeight={800}
          fill="#c084fc"
          textAnchor="middle"
        >
          α {alphaDeg}°
        </text>
        <text
          x={v1.x - 8}
          y={v1.y + 20}
          fontSize={11}
          fontWeight={800}
          fill="#fb7185"
          textAnchor="middle"
        >
          β {betaDeg}°
        </text>
        <text
          x={v2.x + 8}
          y={v2.y + 20}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="middle"
        >
          γ {gammaDeg}°
        </text>
      </svg>
    </ManimCardLayout>
  );
});
