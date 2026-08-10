import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const CENTER_X = SIZE / 2;
const CENTER_Y = 82;
const RADIUS = 42;
const R_VAL = 10;
const CIRCUMFERENCE = Math.round(2 * 3.1 * R_VAL); // 62

const LINE_START = 22;
const LINE_END = 178;

// Level 9: 원의 둘레 (원주 = 2 * 3.1 * r = 지름 * 3.1) 3B1B 3-Step Unrolling 시각화
export const ManimLevel9Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const isUnrolling = stepIndex === 1;
  const isFinalLine = stepIndex === 2;

  const unrollProgress = isUnrolling ? eased : isFinalLine ? 1 : 0;

  // 카드 타이틀 & 캡션 메타데이터
  const stepMeta = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return {
          badgeName: '2. 원의 테두리 펼치기 (Unrolling)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
                원의 둥근 둘레를 직선으로 쫙 펼치기!
              </span>
            </div>
          ),
        };
      case 2:
        return {
          badgeName: '3. 원주 공식 완성 (2 × 3.1 × r)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                2 × 3.1 × {R_VAL}
              </span>
              <span className="geo-divider">=</span>
              <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
                둘레{' '}
                <strong className="highlight-num" style={{ color: '#4ade80' }}>
                  {CIRCUMFERENCE}
                </strong>
              </span>
            </div>
          ),
        };
      default:
        return {
          badgeName: '1. 원의 둘레 (원주)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
                반지름 r={R_VAL} 원의 둘레길이
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
          {/* Step 0 & 1: 원형 둘레 렌더링 */}
          {unrollProgress < 0.99 && (
            <g style={{ opacity: 1 - unrollProgress }}>
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={RADIUS}
                fill="rgba(99, 102, 241, 0.15)"
                stroke="#38bdf8"
                strokeWidth={3}
                strokeDasharray={stepIndex === 0 ? `${(1 - eased) * 263.8} 263.8` : 'none'}
              />
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={CENTER_X + RADIUS}
                y2={CENTER_Y}
                stroke="#38bdf8"
                strokeWidth={2.5}
              />
              <text
                x={CENTER_X + 16}
                y={CENTER_Y - 8}
                fill="#38bdf8"
                fontSize={11}
                fontWeight={800}
              >
                r = {R_VAL}
              </text>
            </g>
          )}

          {/* Step 1 & 2: 1자로 곧게 펼쳐지는 둘레 선 (Unrolled Line) */}
          {unrollProgress > 0.01 && (
            <g style={{ opacity: Math.min(1, unrollProgress * 1.5) }}>
              <line
                x1={LINE_START}
                y1={CENTER_Y}
                x2={LINE_START + (LINE_END - LINE_START) * unrollProgress}
                y2={CENTER_Y}
                stroke="#4ade80"
                strokeWidth={4.5}
                strokeLinecap="round"
              />
              <circle cx={LINE_START} cy={CENTER_Y} r={5} fill="#4ade80" />
              {unrollProgress > 0.8 && (
                <circle
                  cx={LINE_START + (LINE_END - LINE_START) * unrollProgress}
                  cy={CENTER_Y}
                  r={5}
                  fill="#4ade80"
                />
              )}
            </g>
          )}

          {/* Step 2: 펼쳐진 직선 둘레와 지름 3.1배 구분 세그먼트 완료 */}
          {stepIndex === 2 && (
            <g className="unroll-segments">
              {/* 지름 2r (20) 세그먼트 구분선 3개 (20 + 20 + 20 + 2 = 62) */}
              <line
                x1={LINE_START + 50}
                y1={CENTER_Y - 8}
                x2={LINE_START + 50}
                y2={CENTER_Y + 8}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={1.5}
              />
              <line
                x1={LINE_START + 100}
                y1={CENTER_Y - 8}
                x2={LINE_START + 100}
                y2={CENTER_Y + 8}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={1.5}
              />
              <line
                x1={LINE_START + 150}
                y1={CENTER_Y - 8}
                x2={LINE_START + 150}
                y2={CENTER_Y + 8}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={1.5}
              />

              <text
                x={(LINE_START + LINE_END) / 2}
                y={CENTER_Y + 34}
                fill="#4ade80"
                fontSize={12}
                fontWeight={900}
                textAnchor="middle"
              >
                지름(20) × 3.1 = 원주 62
              </text>
            </g>
          )}

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L9 Circle Circumference 3B1B Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel9Visualizer.displayName = 'ManimLevel9Visualizer';
