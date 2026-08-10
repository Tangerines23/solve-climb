import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 12: 입체도형 기초 (기둥 모서리 3n / 뿔 꼭짓점 n+1) 3B1B Wireframe 모핑 애니메이션
// Step 0: 삼각기둥 (모서리 3n = 9개 강조)
// Step 1: 사각뿔 (꼭짓점 n+1 = 5개 모핑 강조)
export const ManimLevel12Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2300,
    moveDuration: 1600,
  });

  let badgeName = '1. 삼각기둥 (모서리 3n개)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        모서리 수 = 3 × n =
      </span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          9개
        </strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 사각뿔 (꼭짓점 n+1개)';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#fb7185' }}>
          꼭짓점 수 = n + 1 =
        </span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          <strong className="highlight-num" style={{ color: '#4ade80' }}>
            5개
          </strong>
        </span>
      </div>
    );
  }

  return (
    <ManimCardLayout
      badgeName={badgeName}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={caption}
    >
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Step 0: 삼각기둥 와이어프레임 */}
        {stepIndex === 0 && (
          <g>
            <polygon
              points="50,60 110,35 150,60"
              fill="rgba(99, 102, 241, 0.12)"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <polygon
              points="50,130 110,105 150,130"
              fill="rgba(99, 102, 241, 0.12)"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <line x1="50" y1="60" x2="50" y2="130" stroke="#38bdf8" strokeWidth={2.5} />
            <line x1="110" y1="35" x2="110" y2="105" stroke="#38bdf8" strokeWidth={2.5} />
            <line x1="150" y1="60" x2="150" y2="130" stroke="#38bdf8" strokeWidth={2.5} />

            {/* 9개 모서리 강조 닷 */}
            <circle cx="50" cy="60" r="4" fill="#38bdf8" />
            <circle cx="110" cy="35" r="4" fill="#38bdf8" />
            <circle cx="150" cy="60" r="4" fill="#38bdf8" />
            <circle cx="50" cy="130" r="4" fill="#38bdf8" />
            <circle cx="110" cy="105" r="4" fill="#38bdf8" />
            <circle cx="150" cy="130" r="4" fill="#38bdf8" />
          </g>
        )}

        {/* Step 1: 사각뿔 와이어프레임 */}
        {stepIndex === 1 && (
          <g>
            {/* 밑면 사각형 */}
            <polygon
              points="50,115 110,100 150,115 90,135"
              fill="rgba(244, 63, 94, 0.12)"
              stroke="#f43f5e"
              strokeWidth={2}
            />

            {/* 4개 뿔 변선 */}
            <line x1="100" y1="35" x2="50" y2="115" stroke="#fb7185" strokeWidth={2} />
            <line
              x1="100"
              y1="35"
              x2="110"
              y2="100"
              stroke="#fb7185"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <line x1="100" y1="35" x2="150" y2="115" stroke="#fb7185" strokeWidth={2} />
            <line x1="100" y1="35" x2="90" y2="135" stroke="#fb7185" strokeWidth={2} />

            {/* 꼭대기 꼭짓점 +1 강조 (Glow) */}
            <circle cx="100" cy="35" r="6" fill="#fb7185" stroke="#ffffff" strokeWidth={2} />

            {/* 밑면 4개 꼭짓점 */}
            <circle cx="50" cy="115" r="4" fill="#38bdf8" />
            <circle cx="110" cy="100" r="4" fill="#38bdf8" />
            <circle cx="150" cy="115" r="4" fill="#38bdf8" />
            <circle cx="90" cy="135" r="4" fill="#38bdf8" />

            <text x="100" y="24" fill="#fb7185" fontSize={10} fontWeight={900} textAnchor="middle">
              +1 (꼭대기)
            </text>
          </g>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L12 Solid Basic 3B1B Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel12Visualizer.displayName = 'ManimLevel12Visualizer';
