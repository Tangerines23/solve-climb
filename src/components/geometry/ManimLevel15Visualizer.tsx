import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 15: 삼각비 기초 (tan 45° = 1, sin 30° = 1/2) 3B1B 삼각비 모핑 애니메이션
// Step 0: 45도 직각이등변삼각형 (tan 45° = 높이/밑변 = 10/10 = 1)
// Step 1: 30도 직각삼각형 모핑 (sin 30° = 높이/빗변 = 5/10 = 1/2)
export const ManimLevel15Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2300,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // Step 0: 45도 (높이 70px) -> Step 1: 30도 (높이 40px) 모핑
  const heightPx = stepIndex === 0 ? 70 - eased * 30 : 40 + eased * 30;

  let badgeName = '1. tan(45°) = 1';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        tan(45°) = 높이 / 밑변 =
      </span>
      <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
        <strong className="highlight-num" style={{ color: '#4ade80' }}>
          1
        </strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. sin(30°) = 1/2';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#fb7185' }}>
          sin(30°) = 높이 / 빗변 =
        </span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          <strong className="highlight-num" style={{ color: '#4ade80' }}>
            1 / 2
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
        <g transform="translate(20, 10)">
          {/* 모핑 직각삼각형 */}
          <polygon
            points={`30,120 140,120 140,${120 - heightPx}`}
            className="geo-shape-poly-morph"
          />

          {/* 직각 표시 */}
          <path
            d={`M 130 120 L 130 110 L 140 110`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1.5}
          />

          {/* 꼭짓점 Dots */}
          <circle cx={30} cy={120} r={4.5} fill="#38bdf8" />
          <circle cx={140} cy={120} r={4.5} fill="#38bdf8" />
          <circle cx={140} cy={120 - heightPx} r={4.5} fill="#fb7185" />

          {/* 라벨 */}
          <text x={85} y={135} fill="#38bdf8" fontSize={11} fontWeight={800} textAnchor="middle">
            밑변
          </text>
          <text x={152} y={120 - heightPx / 2} fill="#fb7185" fontSize={11} fontWeight={800}>
            높이
          </text>
          <text x={75} y={115 - heightPx / 2} fill="#c084fc" fontSize={11} fontWeight={800}>
            빗변
          </text>
        </g>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L15 Trigonometry 3B1B Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel15Visualizer.displayName = 'ManimLevel15Visualizer';
