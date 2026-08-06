import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

export const ManimLevel13Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { isPaused, togglePause } = useManimEngine({
    totalSteps: 1,
    holdDuration: 3000,
    moveDuration: 1000,
  });

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        부피 = 가로 × 세로 × 높이
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName="직육면체 부피 공식"
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points="100,40 150,65 100,90 50,65" className="geo-cube-face face-top" />
        <polygon points="50,65 100,90 100,140 50,115" className="geo-cube-face face-left" />
        <polygon points="100,90 150,65 150,115 100,140" className="geo-cube-face face-right" />

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L13 Volume Rect Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel13Visualizer.displayName = 'ManimLevel13Visualizer';
