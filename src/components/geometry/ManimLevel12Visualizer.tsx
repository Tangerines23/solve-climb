import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

export const ManimLevel12Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { isPaused, togglePause } = useManimEngine({
    totalSteps: 1,
    holdDuration: 3000,
    moveDuration: 1000,
  });

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        n각기둥 모서리 <strong>3n개</strong>
      </span>
      <span className="geo-divider">·</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        n각뿔 꼭짓점 <strong>n+1개</strong>
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName="입체도형 기초 (기둥 / 뿔)"
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points="50,60 110,35 150,60" className="geo-wire-top" />
        <polygon points="50,130 110,105 150,130" className="geo-wire-bottom" />
        <line x1="50" y1="60" x2="50" y2="130" className="geo-wire-edge" />
        <line x1="110" y1="35" x2="110" y2="105" className="geo-wire-edge" />
        <line x1="150" y1="60" x2="150" y2="130" className="geo-wire-edge" />

        <circle cx="50" cy="60" r="4.5" className="geo-wire-dot" />
        <circle cx="110" cy="35" r="4.5" className="geo-wire-dot" />
        <circle cx="150" cy="60" r="4.5" className="geo-wire-dot" />
        <circle cx="50" cy="130" r="4.5" className="geo-wire-dot" />
        <circle cx="110" cy="105" r="4.5" className="geo-wire-dot" />
        <circle cx="150" cy="130" r="4.5" className="geo-wire-dot" />

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L12 Solid Basic Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel12Visualizer.displayName = 'ManimLevel12Visualizer';
