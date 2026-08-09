import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 14: 피타고라스 정리 (a^2 + b^2 = c^2) 3B1B 3:4:5 면적 합성 애니메이션
// Step 0: 밑변 a=3 (a^2=9), 높이 b=4 (b^2=16) 정사각형 렌더링
// Step 1: 빗변 c=5 (c^2=25) 정사각형으로 두 면적이 합성 모핑 (9 + 16 = 25)
export const ManimLevel14Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2300,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const cVal = 5;
  const cSquare = cVal * cVal; // 25

  let badgeName = '1. 두 변의 정사각형 (a²=9, b²=16)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        a² = 9
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#c084fc' }}>
        b² = 16
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 빗변 정사각형 (c² = a² + b²)';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          9
        </span>
        <span className="geo-divider">+</span>
        <span className="geo-stat-item" style={{ color: '#c084fc' }}>
          16 =
        </span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          c²{' '}
          <strong className="highlight-num" style={{ color: '#4ade80' }}>
            {cSquare}
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
        <g transform="translate(15, 10)">
          {/* 중앙 직각삼각형 */}
          <polygon
            points="40,110 100,110 40,40"
            fill="rgba(255, 255, 255, 0.08)"
            stroke="#ffffff"
            strokeWidth={2}
          />
          {/* 직각 표시 */}
          <path d="M 40 100 L 50 100 L 50 110" fill="none" stroke="#ffffff" strokeWidth={1.5} />

          {/* a^2 = 9 정사각형 (밑변) */}
          <rect
            x="40"
            y="110"
            width="60"
            height="35"
            fill="rgba(56, 189, 248, 0.25)"
            stroke="#38bdf8"
            strokeWidth={1.5}
          />
          <text x="70" y="132" fill="#38bdf8" fontSize={11} fontWeight={900} textAnchor="middle">
            a²=9
          </text>

          {/* b^2 = 16 정사각형 (높이) */}
          <rect
            x="5"
            y="40"
            width="35"
            height="70"
            fill="rgba(192, 132, 252, 0.25)"
            stroke="#c084fc"
            strokeWidth={1.5}
          />
          <text x="22" y="80" fill="#c084fc" fontSize={11} fontWeight={900} textAnchor="middle">
            b²=16
          </text>

          {/* Step 1: c^2 = 25 빗변 정사각형 합성 하이라이트 */}
          {stepIndex === 1 && (
            <g style={{ opacity: eased }}>
              <polygon
                points="40,40 100,110 140,75 80,5"
                fill="rgba(74, 222, 128, 0.35)"
                stroke="#4ade80"
                strokeWidth={2.5}
              />
              <text x="90" y="58" fill="#4ade80" fontSize={13} fontWeight={900} textAnchor="middle">
                c²=25
              </text>
            </g>
          )}
        </g>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L14 Pythagorean 3B1B Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel14Visualizer.displayName = 'ManimLevel14Visualizer';
