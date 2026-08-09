import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import { Point, rotatePointAroundPivot, pointsToSvgString, lerp } from './utils/geometryMath';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const TOP_A = 6;
const BOTTOM_B = 10;
const HEIGHT_H = 6;
const PARAL_BASE = TOP_A + BOTTOM_B; // 16
const AREA_VAL = (PARAL_BASE * HEIGHT_H) / 2; // 48

const TOP_W = 45;
const BOTTOM_W = 75;
const H_PX = 50;
const CENTER_Y = 90;

const P1: Point = { x: 50, y: CENTER_Y - H_PX / 2 };
const P2: Point = { x: 50 + TOP_W, y: CENTER_Y - H_PX / 2 };
const P3: Point = { x: 40 + BOTTOM_W, y: CENTER_Y + H_PX / 2 };
const P4: Point = { x: 40, y: CENTER_Y + H_PX / 2 };

// Level 7: 사다리꼴 넓이 (높이 라벨 겹침 방지 정밀 배치)
export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 4,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // 복제 사다리꼴 좌표 및 투명도 계산
  const ghostState = useMemo(() => {
    if (stepIndex === 0) {
      return { opacity: 0, points: [] as Point[] };
    }

    if (stepIndex === 1) {
      const shiftX = (1 - eased) * 15;
      const shiftY = (1 - eased) * -15;
      return {
        opacity: eased * 0.85,
        points: [
          { x: P1.x + shiftX, y: P1.y + shiftY },
          { x: P2.x + shiftX, y: P2.y + shiftY },
          { x: P3.x + shiftX, y: P3.y + shiftY },
          { x: P4.x + shiftX, y: P4.y + shiftY },
        ],
      };
    }

    if (stepIndex === 2) {
      const angleRad = eased * Math.PI;
      const pivot3Prime: Point = {
        x: lerp(P3.x, P2.x, eased),
        y: lerp(P3.y, P2.y, eased),
      };

      const g2 = rotatePointAroundPivot(P2, P3, pivot3Prime, angleRad);
      const g1 = rotatePointAroundPivot(P1, P3, pivot3Prime, angleRad);
      const g4 = rotatePointAroundPivot(P4, P3, pivot3Prime, angleRad);

      return {
        opacity: 0.9,
        points: [g1, g2, pivot3Prime, g4],
      };
    }

    // stepIndex === 3 (분리 이격)
    const offset = eased * 8;
    return {
      opacity: 0.85,
      points: [
        { x: P2.x + BOTTOM_W + offset, y: P2.y - offset },
        { x: P3.x + offset, y: P3.y - offset },
        { x: P2.x + offset, y: P2.y - offset },
        { x: P3.x + TOP_W + offset, y: P3.y - offset },
      ],
    };
  }, [stepIndex, eased]);

  // 메타데이터 정보
  const stepMeta = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return {
          badgeName: '2. 똑같은 사다리꼴 복제',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
                똑같은 사다리꼴 1개 더 생성!
              </span>
            </div>
          ),
        };
      case 2:
        return {
          badgeName: '3. 180° 회전 결합 ➔ 평행사변형',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
                평행사변형 완성! (밑변 = a + b = {TOP_A} + {BOTTOM_B} = {PARAL_BASE})
              </span>
            </div>
          ),
        };
      case 3:
        return {
          badgeName: '4. 절반(÷ 2) 넓이 계산',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                ({TOP_A} + {BOTTOM_B}) × {HEIGHT_H} ÷ 2
              </span>
              <span className="geo-divider">=</span>
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                {PARAL_BASE} × {HEIGHT_H} ÷ 2
              </span>
              <span className="geo-divider">=</span>
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
          badgeName: '1. 사다리꼴 (a=6, b=10, h=6)',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                윗변 <strong>a={TOP_A}</strong>
              </span>
              <span className="geo-divider">,</span>
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                아랫변 <strong>b={BOTTOM_B}</strong>
              </span>
              <span className="geo-divider">,</span>
              <span className="geo-stat-item" style={{ color: '#f43f5e' }}>
                높이 <strong>h={HEIGHT_H}</strong>
              </span>
            </div>
          ),
        };
    }
  }, [stepIndex]);

  const origPointsStr = useMemo(
    () => `${P1.x},${P1.y} ${P2.x},${P2.y} ${P3.x},${P3.y} ${P4.x},${P4.y}`,
    []
  );
  const ghostPointsStr = useMemo(() => pointsToSvgString(ghostState.points), [ghostState.points]);

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
          {/* 복제 사다리꼴 */}
          {ghostState.opacity > 0.01 && (
            <polygon
              points={ghostPointsStr}
              fill="rgba(192, 132, 252, 0.16)"
              stroke="#c084fc"
              strokeWidth={2}
              strokeDasharray={stepIndex === 3 ? '4 3' : 'none'}
              style={{ opacity: ghostState.opacity }}
            />
          )}

          {/* 원본 사다리꼴 */}
          <polygon
            points={origPointsStr}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#38bdf8"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* 높이(h) 수직 점선 & 직각 표시 */}
          <line
            x1={P1.x}
            y1={P1.y}
            x2={P1.x}
            y2={P4.y}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d={`M ${P1.x} ${P4.y - 8} L ${P1.x + 8} ${P4.y - 8} L ${P1.x + 8} ${P4.y}`}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={1.5}
          />

          {/* 치수 라벨 (textAnchor="end" 및 x={P1.x - 6} 으로 수직 점선 기준 오른쪽 끝점 정밀 배치하여 선과 완전히 겹침 방지!) */}
          <text
            x={(P1.x + P2.x) / 2}
            y={P1.y - 8}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            a={TOP_A}
          </text>
          <text
            x={(P4.x + P3.x) / 2}
            y={P4.y + 18}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            b={BOTTOM_B}
          </text>
          <text
            x={P1.x - 6}
            y={CENTER_Y + 4}
            fill="#f43f5e"
            fontSize={11}
            fontWeight={800}
            textAnchor="end"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
          >
            h={HEIGHT_H}
          </text>

          {/* Step 3 절반 분할 표시 */}
          {stepIndex === 3 && (
            <text x={100} y={30} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
              ÷ 2 (절반)
            </text>
          )}

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L7 Trapezoid Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel7Visualizer.displayName = 'ManimLevel7Visualizer';
