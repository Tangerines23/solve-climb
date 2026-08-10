import React, { useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import { Point, rotatePointAroundPivot, pointsToSvgString, lerp } from './utils/geometryMath';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const BASE_VAL = 12;
const HEIGHT_VAL = 8;
const AREA_VAL = (BASE_VAL * HEIGHT_VAL) / 2; // 48
const PARAL_AREA_VAL = BASE_VAL * HEIGHT_VAL; // 96

// 원본 삼각형 기준 좌표
const BASE_P1: Point = { x: 67, y: 58 };
const BASE_P2: Point = { x: 90, y: 138 };
const BASE_P3: Point = { x: 0, y: 138 };
const BASE_TARGET_P4: Point = { x: 157, y: 58 };

// StepIndex 별 X축 정중앙 Shift 오프셋 계산
function getStepOffsetX(stepIndex: number, eased: number): number {
  switch (stepIndex) {
    case 0:
      return 55;
    case 1:
      return lerp(55, 21.5, eased);
    case 2:
    case 3:
      return 21.5;
    case 4:
      return lerp(21.5, 55, eased);
    default:
      return 55;
  }
}

// Level 6: 삼각형 넓이 (높이 라벨을 왼쪽 위 빗변 바깥쪽 공간에 명확히 배치)
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
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
  const p3: Point = { x: BASE_P3.x + currentOffsetX, y: BASE_P3.y };
  const targetP4: Point = { x: BASE_TARGET_P4.x + currentOffsetX, y: BASE_TARGET_P4.y };

  // 복제 삼각형 렌더링 상태 계산
  const ghostState = useMemo(() => {
    if (stepIndex === 0 || stepIndex === 4) {
      return { opacity: 0, points: [] as Point[] };
    }

    if (stepIndex === 1) {
      const angleRad = eased * Math.PI;
      const center2Prime: Point = {
        x: lerp(p2.x, p1.x, eased),
        y: lerp(p2.y, p1.y, eased),
      };

      const g1 = rotatePointAroundPivot(p1, p2, center2Prime, angleRad);
      const g4 = rotatePointAroundPivot(p3, p2, center2Prime, angleRad);

      return {
        opacity: 0.9,
        points: [center2Prime, g1, g4],
      };
    }

    if (stepIndex === 2) {
      return {
        opacity: 0.9,
        points: [p1, p2, targetP4],
      };
    }

    // stepIndex === 3 (분리 및 투명화)
    const offset = eased * 12;
    return {
      opacity: 0.9 - eased * 0.75,
      points: [
        { x: p1.x + offset, y: p1.y - offset },
        { x: p2.x + offset, y: p2.y - offset },
        { x: targetP4.x + offset, y: targetP4.y - offset },
      ],
    };
  }, [stepIndex, eased, p1, p2, p3, targetP4]);

  // 카드 타이틀 & 캡션 메타데이터
  const stepMeta = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return {
          badgeName: '2. 이동/분할 평행사변형 완성',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
                동일 삼각형 2개 합체! ➔ 평행사변형 완성
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
                {BASE_VAL} × {HEIGHT_VAL}
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
                {BASE_VAL} × {HEIGHT_VAL} ÷ 2
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
          badgeName: '5. 삼각형 넓이 완성',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
                삼각형 넓이{' '}
                <strong className="highlight-num" style={{ color: '#4ade80' }}>
                  {AREA_VAL}
                </strong>
              </span>
            </div>
          ),
        };
      default:
        return {
          badgeName: '1. 삼각형',
          caption: (
            <div className="geo-stat-highlights">
              <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
                밑변 <strong>b={BASE_VAL}</strong>
              </span>
              <span className="geo-divider">,</span>
              <span className="geo-stat-item" style={{ color: '#f43f5e' }}>
                높이 <strong>h={HEIGHT_VAL}</strong>
              </span>
            </div>
          ),
        };
    }
  }, [stepIndex]);

  const origPointsStr = useMemo(
    () => `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
    [p1, p2, p3]
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
            {/* 복제 삼각형 교집합 배경색 투명 제거 마스크 */}
            <mask id="l6-ghost-diff-mask">
              <rect x="0" y="0" width={SIZE} height="165" fill="white" />
              <polygon points={origPointsStr} fill="black" />
            </mask>
          </defs>

          {/* 수식 표시 영역 */}
          {stepIndex >= 2 && (
            <g className="formula-group">
              <text
                x={125}
                y={34}
                fill="#c084fc"
                fontSize={11}
                fontWeight={900}
                textAnchor="middle"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
              >
                12 × 8 = 96
              </text>

              {stepIndex >= 3 && (
                <text
                  x={125}
                  y={49}
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

          {/* 복제 삼각형 */}
          {ghostState.opacity > 0.01 && (
            <g style={{ opacity: ghostState.opacity }}>
              <polygon
                points={ghostPointsStr}
                fill="rgba(192, 132, 252, 0.35)"
                mask="url(#l6-ghost-diff-mask)"
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

          {/* 원본 삼각형 */}
          <polygon
            points={origPointsStr}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#38bdf8"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* 높이 수직 점선 & 직각 표시 */}
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p1.x}
            y2={p3.y}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d={`M ${p1.x} ${p3.y - 8} L ${p1.x + 8} ${p3.y - 8} L ${p1.x + 8} ${p3.y}`}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={1.5}
          />

          {/* 치수 라벨 (왼쪽 위 빗변 바깥쪽 탁 트인 빈 공간 x={(p1.x+p3.x)/2 - 14}, y={(p1.y+p3.y)/2 - 10} 에 배치!) */}
          <text
            x={(p3.x + p2.x) / 2}
            y={p3.y + 16}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            밑변 (b={BASE_VAL})
          </text>
          <text
            x={(p1.x + p3.x) / 2 - 14}
            y={(p1.y + p3.y) / 2 - 10}
            fill="#f43f5e"
            fontSize={11}
            fontWeight={800}
            textAnchor="end"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
          >
            높이 (h={HEIGHT_VAL})
          </text>

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L6 Triangle 5-Step Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
