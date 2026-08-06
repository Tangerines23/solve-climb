import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 8: 원의 기초 (반지름 r & 지름 2r) 3B1B 애니메이션
// Step 0: 반지름 (r) 생성 및 360도 스위핑 회전 (원형 자취 그리기)
// Step 1: 반대편 확장 -> 지름 (2r) 완성 모핑
export const ManimLevel8Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const center = SIZE / 2;
  const centerY = 85;
  const radius = 55;

  // Step 0: 반지름 스위핑 각도 (0 -> 360도)
  const angleRad = stepIndex === 0 ? eased * 2 * Math.PI : 0;
  const sweepX = center + radius * Math.cos(angleRad - Math.PI / 2);
  const sweepY = centerY + radius * Math.sin(angleRad - Math.PI / 2);

  // Step 1: 지름 확장 애니메이션
  const diamProgress = stepIndex === 1 ? eased : 0;
  const leftX = center - radius * diamProgress;

  let badgeName = '1. 원의 반지름 (r)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
        반지름 (r) = 중심에서 원주(둘레)까지의 거리
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 원의 지름 (2r)';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          반지름 r
        </span>
        <span className="geo-divider">× 2 =</span>
        <span className="geo-stat-item" style={{ color: '#fb7185', fontWeight: 900 }}>
          지름 (d = 2r)
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
        {/* 원 배경 및 테두리 */}
        <circle cx={center} cy={centerY} r={radius} className="geo-circle-poly" />

        {/* Step 0: 반지름 360도 스위핑 호 (Arc trace) */}
        {stepIndex === 0 && (
          <circle
            cx={center}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth={3}
            strokeDasharray={`${eased * 345.5} 345.5`}
            transform={`rotate(-90 ${center} ${centerY})`}
          />
        )}

        {/* 중심 점 */}
        <circle cx={center} cy={centerY} r={4.5} fill="#38bdf8" />

        {/* Step 0 반지름 회전 선 */}
        {stepIndex === 0 && (
          <line
            x1={center}
            y1={centerY}
            x2={sweepX}
            y2={sweepY}
            stroke="#38bdf8"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Step 1 지름 확장 선 */}
        {stepIndex === 1 && (
          <>
            <line
              x1={leftX}
              y1={centerY}
              x2={center + radius}
              y2={centerY}
              stroke="#fb7185"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <circle cx={leftX} cy={centerY} r={4} fill="#fb7185" />
            <circle cx={center + radius} cy={centerY} r={4} fill="#fb7185" />
          </>
        )}

        {/* 텍스트 표시 */}
        {stepIndex === 0 && (
          <text x={center + 26} y={centerY - 10} fill="#38bdf8" fontSize={11} fontWeight={800}>
            반지름 (r)
          </text>
        )}
        {stepIndex === 1 && (
          <text x={center} y={centerY - 10} fill="#fb7185" fontSize={12} fontWeight={900} textAnchor="middle">
            지름 (d = 2r)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L8 Circle Radius & Diameter 3B1B Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel8Visualizer.displayName = 'ManimLevel8Visualizer';
