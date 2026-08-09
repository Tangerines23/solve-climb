import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const CENTER_X = SIZE / 2;
const CENTER_Y = 82;
const MAX_RADIUS = 52;
const R_VAL = 10;
const AREA_VAL = Math.round(3.1 * R_VAL * R_VAL); // 310

// Level 10: 원의 넓이 (3.1 * r^2 = 310) 3B1B 3-Step 동심원 충진 & r^2 3.1배 직관 시각화
export const ManimLevel10Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // 동심원 링 6개 충진
  const rings = [10, 18, 26, 34, 43, 52];
  const activeRingIndex = Math.floor(eased * rings.length);

  // 카드 타이틀 & 캡션 메타데이터
  const stepMeta = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return {
          badgeName: '2. r² (10×10=100) 사각형 형성',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
                반지름 정사각형 r² = {R_VAL * R_VAL}
              </span>
            </div>
          ),
        };
      case 2:
        return {
          badgeName: '3. 원의 넓이 공식 (3.1 × r²)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                3.1 × {R_VAL}² =
              </span>
              <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
                넓이{' '}
                <strong className="highlight-num" style={{ color: '#4ade80' }}>
                  {AREA_VAL}
                </strong>
              </span>
            </div>
          ),
        };
      default:
        return {
          badgeName: '1. 원의 내부 면적 충진',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
                원 내부 면적 (반지름 r = {R_VAL})
              </span>
            </div>
          ),
        };
    }
  }, [stepIndex]);

  return (
    <ManimCardLayout
      badgeName={stepMeta.badgeName}
      isPaused={isPaused}
      onTogglePause={togglePause}
      captionContent={stepMeta.caption}
    >
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          {/* 전체 외곽 원 */}
          <circle cx={CENTER_X} cy={CENTER_Y} r={MAX_RADIUS} className="geo-circle-poly" />

          {/* Step 0: 동심원 링 면적 충진 애니메이션 */}
          {rings.map((r, idx) => {
            const isVisible = stepIndex >= 1 || idx <= activeRingIndex;
            const opacity = isVisible ? (stepIndex >= 1 ? 0.3 : 0.12 + idx * 0.04) : 0;
            return (
              <circle
                key={idx}
                cx={CENTER_X}
                cy={CENTER_Y}
                r={r}
                fill={`rgba(99, 102, 241, ${opacity})`}
                stroke="rgba(129, 140, 248, 0.4)"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Step 1 & 2: r^2 정사각형 오버레이 (r * r) */}
          {stepIndex >= 1 && (
            <rect
              x={CENTER_X}
              y={CENTER_Y - MAX_RADIUS}
              width={MAX_RADIUS * (stepIndex === 1 ? eased : 1)}
              height={MAX_RADIUS * (stepIndex === 1 ? eased : 1)}
              fill="rgba(192, 132, 252, 0.22)"
              stroke="#c084fc"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )}

          {/* Step 2: 원 전체 은은한 초록 하이라이트 넓이 모핑 */}
          {stepIndex === 2 && (
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={MAX_RADIUS}
              fill="rgba(74, 222, 128, 0.15)"
              stroke="#4ade80"
              strokeWidth={2.5}
            />
          )}

          {/* 반지름 표시 선 */}
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={CENTER_X + MAX_RADIUS}
            y2={CENTER_Y}
            stroke="#38bdf8"
            strokeWidth={2.5}
          />
          <circle cx={CENTER_X} cy={CENTER_Y} r={4} fill="#38bdf8" />
          <text x={CENTER_X + 18} y={CENTER_Y + 16} fill="#38bdf8" fontSize={11} fontWeight={800}>
            r = {R_VAL}
          </text>

          {/* Step 2 수식 오버레이 */}
          {stepIndex === 2 && (
            <text
              x={CENTER_X}
              y={24}
              fill="#4ade80"
              fontSize={12}
              fontWeight={900}
              textAnchor="middle"
            >
              3.1 × 10² = 넓이 310
            </text>
          )}

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L10 Circle Area 3B1B Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel10Visualizer.displayName = 'ManimLevel10Visualizer';
