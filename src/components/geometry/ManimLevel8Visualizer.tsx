import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const CENTER_X = SIZE / 2;
const CENTER_Y = 88;
const RADIUS = 55;

// Level 8: 원의 기초 (반지름 r & 지름 2r) 3B1B 애니메이션 (색상 #f43f5e Rose/Red 100% 통일)
export const ManimLevel8Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // Step 0: 반지름 스위핑 각도 (0 -> 360도)
  const angleRad = stepIndex === 0 ? eased * 2 * Math.PI : 0;
  const sweepX = CENTER_X + RADIUS * Math.cos(angleRad - Math.PI / 2);
  const sweepY = CENTER_Y + RADIUS * Math.sin(angleRad - Math.PI / 2);

  // Step 1: 반대편 반지름 확장
  const leftDiamProgress = stepIndex === 1 ? eased : stepIndex >= 2 ? 1 : 0;
  const leftX = CENTER_X - RADIUS * leftDiamProgress;

  // 카드 타이틀 & 캡션 메타데이터
  const stepMeta = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return {
          badgeName: '2. 반대편 반지름 확장 ➔ 지름 (2r)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                반지름 r
              </span>
              <span className="geo-divider">+</span>
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                반지름 r
              </span>
              <span className="geo-divider">=</span>
              <span className="geo-stat-item" style={{ color: '#f43f5e', fontWeight: 900 }}>
                지름 (d = 2r)
              </span>
            </div>
          ),
        };
      case 2:
        return {
          badgeName: '3. 지름과 반지름 관계 완성',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
                지름 (d) = 반지름 (r) × 2
              </span>
            </div>
          ),
        };
      default:
        return {
          badgeName: '1. 원의 반지름 (r)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8', fontWeight: 800 }}>
                반지름 (r) = 중심에서 원주(둘레)까지의 거리
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
          {/* 원 배경 및 테두리 */}
          <circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS} className="geo-circle-poly" />

          {/* Step 0: 반지름 360도 스위핑 호 (Arc trace) */}
          {stepIndex === 0 && (
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={RADIUS}
              fill="none"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth={3}
              strokeDasharray={`${eased * 345.5} 345.5`}
              transform={`rotate(-90 ${CENTER_X} ${CENTER_Y})`}
            />
          )}

          {/* 중심 점 */}
          <circle cx={CENTER_X} cy={CENTER_Y} r={4.5} fill="#38bdf8" />

          {/* Step 0 반지름 회전 선 */}
          {stepIndex === 0 && (
            <line
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={sweepX}
              y2={sweepY}
              stroke="#38bdf8"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {/* Step 1 & 2: 지름 선 (Rose/Red #f43f5e 로 100% 통일) */}
          {stepIndex >= 1 && (
            <>
              {/* 오른쪽 반지름 (Cyan) */}
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={CENTER_X + RADIUS}
                y2={CENTER_Y}
                stroke="#38bdf8"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* 왼쪽 반지름 확장 (Rose/Red #f43f5e) */}
              <line
                x1={leftX}
                y1={CENTER_Y}
                x2={CENTER_X}
                y2={CENTER_Y}
                stroke="#f43f5e"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              <circle cx={leftX} cy={CENTER_Y} r={4} fill="#f43f5e" />
              <circle cx={CENTER_X + RADIUS} cy={CENTER_Y} r={4} fill="#38bdf8" />
            </>
          )}

          {/* 텍스트 라벨 */}
          {stepIndex === 0 && (
            <text x={CENTER_X + 22} y={CENTER_Y - 10} fill="#38bdf8" fontSize={11} fontWeight={800}>
              반지름 (r)
            </text>
          )}

          {stepIndex >= 1 && (
            <text
              x={CENTER_X}
              y={CENTER_Y - 12}
              fill="#f43f5e"
              fontSize={12}
              fontWeight={900}
              textAnchor="middle"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
            >
              지름 (d = 2r)
            </text>
          )}

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L8 Circle Radius & Diameter 3B1B Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel8Visualizer.displayName = 'ManimLevel8Visualizer';
