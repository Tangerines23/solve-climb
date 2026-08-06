import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

interface QuadKeyframe {
  v0: Point;
  v1: Point;
  v2: Point;
  v3: Point;
  name: string;
}

const QUAD_KEYFRAMES: QuadKeyframe[] = [
  {
    v0: { x: 65, y: 45 },
    v1: { x: 165, y: 45 },
    v2: { x: 135, y: 135 },
    v3: { x: 35, y: 135 },
    name: '평행사변형',
  },
  {
    v0: { x: 45, y: 45 },
    v1: { x: 155, y: 45 },
    v2: { x: 155, y: 135 },
    v3: { x: 45, y: 135 },
    name: '직사각형',
  },
  {
    v0: { x: 55, y: 45 },
    v1: { x: 145, y: 45 },
    v2: { x: 145, y: 135 },
    v3: { x: 55, y: 135 },
    name: '정사각형',
  },
  {
    v0: { x: 100, y: 45 },
    v1: { x: 170, y: 90 },
    v2: { x: 100, y: 135 },
    v3: { x: 30, y: 90 },
    name: '마름모',
  },
];

export const ManimLevel4Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: QUAD_KEYFRAMES.length,
    holdDuration: 2000, // 형태 완성 후 2.0초 대기
    moveDuration: 3000, // 부드러운 3.0초 변형 애니메이션
  });

  const currFrame = QUAD_KEYFRAMES[stepIndex]!;
  const nextFrame = QUAD_KEYFRAMES[(stepIndex + 1) % QUAD_KEYFRAMES.length]!;

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
  const v3 = {
    x: currFrame.v3.x + (nextFrame.v3.x - currFrame.v3.x) * eased,
    y: currFrame.v3.y + (nextFrame.v3.y - currFrame.v3.y) * eased,
  };

  const currentName = currFrame.name;

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

  const caption = (
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
          points={`${v0.x.toFixed(1)},${v0.y.toFixed(1)} ${v1.x.toFixed(1)},${v1.y.toFixed(1)} ${v2.x.toFixed(1)},${v2.y.toFixed(1)} ${v3.x.toFixed(1)},${v3.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        <path d={arcV0} fill="rgba(251, 113, 133, 0.35)" stroke="#fb7185" strokeWidth={1.5} />
        <path d={arcV2} fill="rgba(251, 113, 133, 0.35)" stroke="#fb7185" strokeWidth={1.5} />

        <path d={arcV1} fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth={1.5} />
        <path d={arcV3} fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth={1.5} />

        <line x1={v0.x} y1={v0.y} x2={v1.x} y2={v1.y} className="geo-edge-animated-line" />
        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} className="geo-edge-animated-line" />
        <line x1={v2.x} y1={v2.y} x2={v3.x} y2={v3.y} className="geo-edge-animated-line" />
        <line x1={v3.x} y1={v3.y} x2={v0.x} y2={v0.y} className="geo-edge-animated-line" />

        <circle
          cx={v0.x}
          cy={v0.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#fb7185' }}
        />
        <circle
          cx={v1.x}
          cy={v1.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />
        <circle
          cx={v2.x}
          cy={v2.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#fb7185' }}
        />
        <circle
          cx={v3.x}
          cy={v3.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />

        {isAdminMode && (
          <>
            <line
              x1={v0.x}
              y1={v0.y}
              x2={v2.x}
              y2={v2.y}
              stroke="#c084fc"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <line
              x1={v1.x}
              y1={v1.y}
              x2={v3.x}
              y2={v3.y}
              stroke="#c084fc"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              opacity={0.7}
            />
          </>
        )}

        <text
          x={v0.x - 10}
          y={v0.y - 8}
          fontSize={11}
          fontWeight={800}
          fill="#fb7185"
          textAnchor="end"
        >
          α {alphaDeg}°
        </text>
        <text
          x={v1.x + 10}
          y={v1.y - 8}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="start"
        >
          β {betaDeg}°
        </text>
        <text
          x={v2.x + 10}
          y={v2.y + 16}
          fontSize={11}
          fontWeight={800}
          fill="#fb7185"
          textAnchor="start"
        >
          γ {alphaDeg}°
        </text>
        <text
          x={v3.x - 10}
          y={v3.y + 16}
          fontSize={11}
          fontWeight={800}
          fill="#38bdf8"
          textAnchor="end"
        >
          δ {betaDeg}°
        </text>
      </svg>
    </ManimCardLayout>
  );
});
