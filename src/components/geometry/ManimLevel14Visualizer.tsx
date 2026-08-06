import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

export const ManimLevel14Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { isPaused, togglePause } = useManimEngine({
    totalSteps: 1,
    holdDuration: 3000,
    moveDuration: 1000,
  });

  const caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        3² + 4² = 5² (9 + 16 = 25)
      </span>
      <span className="geo-divider">·</span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        비율 3 : 4 : 5
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName="피타고라스 정리"
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        <polygon points="40,140 160,140 40,50" className="geo-pythagoras-poly" />
        <rect x="40" y="125" width="15" height="15" className="geo-right-angle-box" />
        <text x="95" y="156" className="geo-dim-text">
          밑변 3
        </text>
        <text x="22" y="100" className="geo-dim-text">
          높이 4
        </text>
        <text x={SIZE / 2} y={85} className="geo-hypotenuse-text" textAnchor="middle">
          빗변 5
        </text>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L14 Pythagorean Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel14Visualizer.displayName = 'ManimLevel14Visualizer';
