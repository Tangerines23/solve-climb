import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

export const ManimLevel15Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { isPaused, togglePause } = useManimEngine({
    totalSteps: 1,
    holdDuration: 3000,
    moveDuration: 1000,
  });

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        tan(45°) = 높이 / 밑변 = 1 / 1 = 1
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName="삼각비 기초 (tan 45°)"
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points="40,135 150,135 150,25" className="geo-pythagoras-poly" />
        <rect x="135" y="120" width="15" height="15" className="geo-right-angle-box" />
        <text x="45" y="125" fill="#4ADE80" fontSize="13" fontWeight="bold">
          45°
        </text>
        <text x="95" y="152" className="geo-dim-text">
          밑변 = 1
        </text>
        <text x="160" y="85" className="geo-dim-text">
          높이 = 1
        </text>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L15 Trigonometry Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel15Visualizer.displayName = 'ManimLevel15Visualizer';
