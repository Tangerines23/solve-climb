import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 10: 원의 넓이 (3.1 * r^2) 3B1B 동심원 충진(Concentric Fill) 애니메이션
// Step 0: 중심점에서 외곽까지 동심원 링 확산 면적 충진
// Step 1: 3.1 * r^2 = 310 넓이 공식 도출 강조
export const ManimLevel10Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const center = SIZE / 2;
  const centerY = 85;
  const maxRadius = 55;
  const rVal = 10;
  const areaVal = Math.round(3.1 * rVal * rVal); // 310

  // 동심원 링 개수 (6개 링 충진 애니메이션)
  const rings = [10, 19, 28, 37, 46, 55];
  const activeRingIndex = Math.floor(eased * rings.length);

  let badgeName = '1. 원의 내부 면적 충진';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
        원 내부 면적 (반지름 r = {rVal})
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 원의 넓이 공식';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          3.1 × {rVal}² =
        </span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          넓이{' '}
          <strong className="highlight-num" style={{ color: '#4ade80' }}>
            {areaVal}
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
        {/* 전체 외곽선 */}
        <circle cx={center} cy={centerY} r={maxRadius} className="geo-circle-poly" />

        {/* Step 0: 동심원 링 면적 충진 애니메이션 */}
        {rings.map((r, idx) => {
          const isVisible = stepIndex === 1 || idx <= activeRingIndex;
          const opacity = isVisible ? (stepIndex === 1 ? 0.35 : 0.15 + idx * 0.04) : 0;
          return (
            <circle
              key={idx}
              cx={center}
              cy={centerY}
              r={r}
              fill={`rgba(99, 102, 241, ${opacity})`}
              stroke="rgba(129, 140, 248, 0.4)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Step 1: 면적 하이라이트 채우기 */}
        {stepIndex === 1 && (
          <circle
            cx={center}
            cy={centerY}
            r={maxRadius * (0.2 + 0.8 * eased)}
            className="geo-circle-fill-animated"
          />
        )}

        {/* 반지름 표시 선 */}
        <line
          x1={center}
          y1={centerY}
          x2={center + maxRadius}
          y2={centerY}
          className="geo-radius-line"
        />
        <circle cx={center} cy={centerY} r={4} fill="#38bdf8" />
        <text x={center + 22} y={centerY - 8} fill="#38bdf8" fontSize={11} fontWeight={800}>
          r = {rVal}
        </text>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L10 Circle Area Concentric Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel10Visualizer.displayName = 'ManimLevel10Visualizer';
