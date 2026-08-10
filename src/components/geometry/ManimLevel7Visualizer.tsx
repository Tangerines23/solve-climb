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
const PARAL_AREA_VAL = PARAL_BASE * HEIGHT_H; // 96

const TOP_W = 45;
const BOTTOM_W = 75;
const H_PX = 48;
const CENTER_Y = 104;

// 사다리꼴 기준 좌표
const BASE_P1: Point = { x: 10, y: CENTER_Y - H_PX / 2 };
const BASE_P2: Point = { x: 10 + TOP_W, y: CENTER_Y - H_PX / 2 };
const BASE_P3: Point = { x: 0 + BOTTOM_W, y: CENTER_Y + H_PX / 2 };
const BASE_P4: Point = { x: 0, y: CENTER_Y + H_PX / 2 };

// X축 정중앙 오프셋 계산
function getStepOffsetX(stepIndex: number, eased: number): number {
  switch (stepIndex) {
    case 0:
      return 62.5;
    case 1:
      return lerp(62.5, 40, eased);
    case 2:
    case 3:
      return 40;
    case 4:
      return lerp(40, 62.5, eased);
    default:
      return 62.5;
  }
}

// Level 7: 사다리꼴 넓이 (회전 시 페이드인 없이 원본과 겹치지 않는 차집합 영역만 선명하게 칠해지도록 구현)
export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 5,
    holdDuration: 2000,
    moveDuration: 1500,
  });

  const eased = getEasedProgress();
  const currentOffsetX = getStepOffsetX(stepIndex, eased);

  // Shift 적용 꼭짓점 좌표
  const p1: Point = useMemo(
    () => ({ x: BASE_P1.x + currentOffsetX, y: BASE_P1.y }),
    [currentOffsetX]
  );
  const p2: Point = useMemo(
    () => ({ x: BASE_P2.x + currentOffsetX, y: BASE_P2.y }),
    [currentOffsetX]
  );
  const p3: Point = useMemo(
    () => ({ x: BASE_P3.x + currentOffsetX, y: BASE_P3.y }),
    [currentOffsetX]
  );
  const p4: Point = useMemo(
    () => ({ x: BASE_P4.x + currentOffsetX, y: BASE_P4.y }),
    [currentOffsetX]
  );

  // 오른쪽 빗변(p2-p3)의 중점 M (Midpoint)
  const midPoint: Point = useMemo(
    () => ({
      x: (p2.x + p3.x) / 2,
      y: (p2.y + p3.y) / 2,
    }),
    [p2, p3]
  );

  // 복제 사다리꼴 좌표 및 투명도 계산 (페이드인 제거 및 마스크를 통한 실시간 차집합 채색)
  const ghostState = useMemo(() => {
    if (stepIndex === 0 || stepIndex === 4) {
      return { opacity: 0, points: [] as Point[] };
    }

    if (stepIndex === 1) {
      const angleRad = eased * Math.PI;

      const g1 = rotatePointAroundPivot(p1, midPoint, midPoint, angleRad);
      const g2 = rotatePointAroundPivot(p2, midPoint, midPoint, angleRad);
      const g3 = rotatePointAroundPivot(p3, midPoint, midPoint, angleRad);
      const g4 = rotatePointAroundPivot(p4, midPoint, midPoint, angleRad);

      return {
        // 흐릿한 페이드인(eased * 0.9) 대신 바로 선명한 0.9 불투명도 적용 (마스크가 겹치지 않는 부분만 깨끗이 채색!)
        opacity: 0.9,
        points: [g1, g2, g3, g4],
      };
    }

    if (stepIndex === 2) {
      const g1 = rotatePointAroundPivot(p1, midPoint, midPoint, Math.PI);
      const g2 = rotatePointAroundPivot(p2, midPoint, midPoint, Math.PI);
      const g3 = rotatePointAroundPivot(p3, midPoint, midPoint, Math.PI);
      const g4 = rotatePointAroundPivot(p4, midPoint, midPoint, Math.PI);

      return {
        opacity: 0.9,
        points: [g1, g2, g3, g4],
      };
    }

    // stepIndex === 3 (분리 및 투명화 이격)
    const offset = eased * 12;
    const g1 = rotatePointAroundPivot(p1, midPoint, midPoint, Math.PI);
    const g2 = rotatePointAroundPivot(p2, midPoint, midPoint, Math.PI);
    const g3 = rotatePointAroundPivot(p3, midPoint, midPoint, Math.PI);
    const g4 = rotatePointAroundPivot(p4, midPoint, midPoint, Math.PI);

    return {
      opacity: 0.9 - eased * 0.75,
      points: [
        { x: g1.x + offset, y: g1.y - offset },
        { x: g2.x + offset, y: g2.y - offset },
        { x: g3.x + offset, y: g3.y - offset },
        { x: g4.x + offset, y: g4.y - offset },
      ],
    };
  }, [stepIndex, eased, p1, p2, p3, p4, midPoint]);

  // 메타데이터 정보
  const stepMeta = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return {
          badgeName: '2. 이동/분할 평행사변형 완성',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
                동일 사다리꼴 2개 합체! ➔ 평행사변형 완성
              </span>
            </div>
          ),
        };
      case 2:
        return {
          badgeName: '3. 평행사변형 넓이',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                ({TOP_A} + {BOTTOM_B}) × {HEIGHT_H}
              </span>
              <span className="geo-divider">=</span>
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 900 }}>
                평행사변형 넓이 <strong>{PARAL_AREA_VAL}</strong>
              </span>
            </div>
          ),
        };
      case 3:
        return {
          badgeName: '4. 절반(÷ 2) 분할 넓이',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                ({TOP_A} + {BOTTOM_B}) × {HEIGHT_H} ÷ 2
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
      case 4:
        return {
          badgeName: '5. 사다리꼴 넓이 완성',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
                사다리꼴 넓이{' '}
                <strong className="highlight-num" style={{ color: '#4ade80' }}>
                  {AREA_VAL}
                </strong>
              </span>
            </div>
          ),
        };
      default:
        return {
          badgeName: '1. 사다리꼴',
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
    () => `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
    [p1, p2, p3, p4]
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
          <defs>
            {/* 복제 사다리꼴 교집합 배경색 투명 제거 마스크 */}
            <mask id="l7-ghost-diff-mask">
              <rect x="0" y="0" width={SIZE} height="165" fill="white" />
              <polygon points={origPointsStr} fill="black" />
            </mask>
          </defs>

          {/* 수식 표시 영역 */}
          {stepIndex >= 2 && (
            <g className="formula-group">
              <text
                x={100}
                y={30}
                fill="#c084fc"
                fontSize={11}
                fontWeight={900}
                textAnchor="middle"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
              >
                (6 + 10) × 6 = 96
              </text>

              {stepIndex >= 3 && (
                <text
                  x={100}
                  y={45}
                  fill="#4ade80"
                  fontSize={12}
                  fontWeight={900}
                  textAnchor="middle"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
                >
                  ÷ 2 = 48
                </text>
              )}
            </g>
          )}

          {/* 복제 사다리꼴 */}
          {ghostState.opacity > 0.01 && (
            <g style={{ opacity: ghostState.opacity }}>
              <polygon
                points={ghostPointsStr}
                fill="rgba(192, 132, 252, 0.35)"
                mask="url(#l7-ghost-diff-mask)"
              />
              <polygon
                points={ghostPointsStr}
                fill="none"
                stroke="#c084fc"
                strokeWidth={2}
                strokeDasharray={stepIndex >= 3 ? '4 3' : 'none'}
              />
            </g>
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
            x1={p1.x}
            y1={p1.y}
            x2={p1.x}
            y2={p4.y}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d={`M ${p1.x} ${p4.y - 8} L ${p1.x + 8} ${p4.y - 8} L ${p1.x + 8} ${p4.y}`}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={1.5}
          />

          {/* 치수 라벨 */}
          <text
            x={(p1.x + p2.x) / 2}
            y={p1.y - 7}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            a={TOP_A}
          </text>
          <text
            x={(p4.x + p3.x) / 2}
            y={p4.y + 16}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            b={BOTTOM_B}
          </text>
          <text
            x={p1.x - 6}
            y={CENTER_Y + 4}
            fill="#f43f5e"
            fontSize={11}
            fontWeight={800}
            textAnchor="end"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
          >
            h={HEIGHT_H}
          </text>

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L7 Trapezoid 5-Step Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel7Visualizer.displayName = 'ManimLevel7Visualizer';
