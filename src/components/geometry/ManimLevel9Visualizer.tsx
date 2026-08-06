import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 9: 원의 둘레 (원주 = 2 * 3.1 * r) 3B1B Unrolling(원주 펼치기) 애니메이션
// Step 0: 원의 둘레 회전 파동 (반지름 r=10)
// Step 1: 원 테두리가 부드럽게 직선으로 펼쳐지며 2 * 3.1 * r = 62 증명
export const ManimLevel9Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const center = SIZE / 2;
  const centerY = 85;
  const radius = 45;
  const rVal = 10;
  const circumference = Math.round(2 * 3.1 * rVal); // 62

  // Step 1 Unrolling 모핑 (원 -> 직선)
  // eased: 0 (원) -> 1 (직선)
  const isUnrolling = stepIndex === 1;
  const unrollEased = isUnrolling ? eased : 0;

  // 원의 둘레 길이 Px = 2 * Math.PI * 45 ≈ 282.7px -> 화면 내에 컴팩트하게 축소 표시
  const lineStart = 25;
  const lineEnd = 175;

  let badgeName = '1. 원의 둘레 (원주)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
        원주 = 원 테두리 한 바퀴의 길이 (원주율 3.1)
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 둘레 펼치기 (Unrolling)';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          2 × 3.1 × {rVal} =
        </span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          둘레{' '}
          <strong className="highlight-num" style={{ color: '#4ade80' }}>
            {circumference}
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
        {/* Step 0: 원 상태 */}
        {unrollEased < 0.99 && (
          <g style={{ opacity: 1 - unrollEased }}>
            <circle
              cx={center}
              cy={centerY}
              r={radius}
              fill="rgba(56, 189, 248, 0.1)"
              stroke="#38bdf8"
              strokeWidth={3}
              strokeDasharray={stepIndex === 0 ? `${(1 - eased) * 282} 282` : 'none'}
            />
            <line
              x1={center}
              y1={centerY}
              x2={center + radius}
              y2={centerY}
              className="geo-radius-line"
            />
            <text x={center + 20} y={centerY - 8} fill="#38bdf8" fontSize={11} fontWeight={800}>
              r = {rVal}
            </text>
          </g>
        )}

        {/* Step 1: 직선으로 부드럽게 펼쳐진 둘레 Line (Unrolled Line) */}
        {unrollEased > 0.01 && (
          <g style={{ opacity: unrollEased }}>
            {/* 펼쳐진 둘레 선 */}
            <line
              x1={lineStart}
              y1={centerY}
              x2={lineStart + (lineEnd - lineStart) * unrollEased}
              y2={centerY}
              stroke="#4ade80"
              strokeWidth={4}
              strokeLinecap="round"
            />
            {/* 끝 꼭짓점 Dots */}
            <circle cx={lineStart} cy={centerY} r={4.5} fill="#4ade80" />
            {unrollEased > 0.8 && <circle cx={lineEnd} cy={centerY} r={4.5} fill="#4ade80" />}

            {/* 지름(2r) 3.1배 구분 가이드 점선 */}
            <line
              x1={lineStart}
              y1={centerY + 18}
              x2={lineEnd}
              y2={centerY + 18}
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <text
              x={(lineStart + lineEnd) / 2}
              y={centerY + 34}
              fill="#4ade80"
              fontSize={11}
              fontWeight={900}
              textAnchor="middle"
            >
              지름(20) × 3.1 = 둘레 62
            </text>
          </g>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L9 Circle Circumference Unrolling Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel9Visualizer.displayName = 'ManimLevel9Visualizer';
