import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

export const ManimLevel10Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { isPaused, togglePause } = useManimEngine({
    totalSteps: 1,
    holdDuration: 3000,
    moveDuration: 1000,
  });

  const center = SIZE / 2;
  const centerY = 85;
  const rVal = 10;
  const areaVal = Math.round(3.1 * rVal * rVal);

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        넓이 = 3.1 × {rVal}² =
      </span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          {areaVal}
        </strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName="원의 넓이 공식"
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <circle cx={center} cy={centerY} r={55} className="geo-circle-fill-animated" />
        <line x1={center} y1={centerY} x2={center + 55} y2={centerY} className="geo-radius-line" />
        <text x={center + 25} y={centerY - 8} className="geo-dim-text">
          r = {rVal}
        </text>
        <text x={center} y={centerY + 20} className="geo-circle-text">
          원주율 π ≈ 3.1
        </text>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L10 Circle Area Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel10Visualizer.displayName = 'ManimLevel10Visualizer';
