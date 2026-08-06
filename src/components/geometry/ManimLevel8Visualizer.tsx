import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

export const ManimLevel8Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2000,
    moveDuration: 1500,
  });

  const eased = getEasedProgress();

  // Step 0: 반지름 (r), Step 1: 지름 (d = 2r)
  const isRadiusPhase = stepIndex === 0;
  const lineLength = isRadiusPhase ? 55 * (0.3 + 0.7 * eased) : 55 * 2;

  const center = SIZE / 2;
  const centerY = 85;
  const radius = 55;

  const caption = isRadiusPhase ? (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
        반지름 (r) = 원 중심에서 둘레까지 거리
      </span>
    </div>
  ) : (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#fb7185', fontWeight: 900 }}>
        지름 (d) = 2 × 반지름 (2r)
      </span>
    </div>
  );

  return (
    <ManimCardLayout
      badgeName={isRadiusPhase ? '1. 원의 반지름 (r)' : '2. 원의 지름 (2r)'}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* 원 배경 */}
        <circle cx={center} cy={centerY} r={radius} className="geo-circle-poly" />

        {/* 중심점 */}
        <circle cx={center} cy={centerY} r={4.5} fill="#38bdf8" />

        {/* 반지름 / 지름 선 */}
        {isRadiusPhase ? (
          <line
            x1={center}
            y1={centerY}
            x2={center + lineLength}
            y2={centerY}
            className="geo-radius-line"
          />
        ) : (
          <line
            x1={center - radius}
            y1={centerY}
            x2={center + radius}
            y2={centerY}
            stroke="#fb7185"
            strokeWidth={3}
          />
        )}

        {/* 텍스트 표시 */}
        {isRadiusPhase ? (
          <text x={center + 28} y={centerY - 8} className="geo-dim-text">
            반지름 (r)
          </text>
        ) : (
          <text
            x={center}
            y={centerY - 10}
            fill="#fb7185"
            fontSize={11}
            fontWeight={900}
            textAnchor="middle"
          >
            지름 (2r)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L8 Circle Basic Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel8Visualizer.displayName = 'ManimLevel8Visualizer';
