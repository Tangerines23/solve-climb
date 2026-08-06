import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

// Level 13: 직육면체 부피 (가로 * 세로 * 높이) 3B1B 3D 적층(Volumetric Layering) 애니메이션
// Step 0: 밑면 2D 격자 넓이 형성 (가로 4 * 세로 3 = 12)
// Step 1: 높이 H=5 수직 층층이 적층 모핑 -> 부피 60 입증
export const ManimLevel13Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 2,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const widthW = 4;
  const depthD = 3;
  const heightH = 5;
  const baseArea = widthW * depthD; // 12
  const volumeVal = baseArea * heightH; // 60

  // 높이 적층 스케일 (0 -> 1)
  const stackHeightPx = stepIndex === 1 ? 55 * eased : 0;

  let badgeName = '1. 밑면 넓이 (4 × 3)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑면 넓이 = 가로 4 × 세로 3 =
      </span>
      <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
        12
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 높이 적층 부피 (12 × 5)';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          4 × 3 × 5 =
        </span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          부피{' '}
          <strong className="highlight-num" style={{ color: '#4ade80' }}>
            {volumeVal}
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
        <g transform="translate(0, 10)">
          {/* 적층 3D 직육면체 볼륨 */}
          <polygon
            points={`50,${120 - stackHeightPx} 120,${95 - stackHeightPx} 160,${110 - stackHeightPx} 90,${135 - stackHeightPx}`}
            fill="rgba(56, 189, 248, 0.35)"
            stroke="#38bdf8"
            strokeWidth={2}
          />

          {/* 앞면 */}
          <polygon
            points={`90,135 160,110 160,${110 - stackHeightPx} 90,${135 - stackHeightPx}`}
            fill="rgba(99, 102, 241, 0.4)"
            stroke="#6366f1"
            strokeWidth={2}
          />

          {/* 좌측면 */}
          <polygon
            points={`50,120 90,135 90,${135 - stackHeightPx} 50,${120 - stackHeightPx}`}
            fill="rgba(99, 102, 241, 0.25)"
            stroke="#6366f1"
            strokeWidth={2}
          />

          {/* 높이(H) 점선 가이드 */}
          {stepIndex === 1 && (
            <g>
              <line x1="168" y1="110" x2="168" y2={110 - stackHeightPx} stroke="#fb7185" strokeWidth={2} strokeDasharray="3 3" />
              <text x="178" y={110 - stackHeightPx / 2 + 4} fill="#fb7185" fontSize={11} fontWeight={900}>
                h=5
              </text>
            </g>
          )}

          {/* 치수 라벨 */}
          <text x="70" y="142" fill="#38bdf8" fontSize={10} fontWeight={800}>
            가로 4
          </text>
          <text x="135" y="132" fill="#38bdf8" fontSize={10} fontWeight={800}>
            세로 3
          </text>
        </g>

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L13 Volume Stacking Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel13Visualizer.displayName = 'ManimLevel13Visualizer';
