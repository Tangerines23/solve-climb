import React from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

// Level 7: 사다리꼴 넓이 ((a + b) * h / 2) 3B1B 수학적 기하 회전 애니메이션
// 꼭짓점 규격: V1(점1: 윗변좌), V2(점2: 윗변우-피벗), V3(점3: 아랫변우), V4(점4: 아랫변좌)
// 제시1 피벗 회전: 원본 사다리꼴 위치에서 V2(점2) 피벗을 중심으로 복제본이 180도 회전하여 빗변에 맞물려 평행사변형 완성!
export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // 사다리꼴 수치
  const topA = 6;
  const bottomB = 10;
  const heightH = 6;
  const paralBase = topA + bottomB; // 16
  const areaVal = (paralBase * heightH) / 2; // 48

  // 좌표 세팅
  const topW = 45; // a = 6 비율
  const bottomW = 75; // b = 10 비율
  const hPx = 50; // h = 6 비율
  const centerY = 90;

  // 원본 사다리꼴 꼭짓점
  // V1 (점1: 윗변좌), V2 (점2: 윗변우-피벗), V3 (점3: 아랫변우), V4 (점4: 아랫변좌)
  const v1: Point = { x: 65, y: centerY - hPx / 2 }; // (65, 65)
  const v2: Point = { x: 65 + topW, y: centerY - hPx / 2 }; // (110, 65) -> 피벗 점
  const v3: Point = { x: 50 + bottomW, y: centerY + hPx / 2 }; // (125, 115)
  const v4: Point = { x: 50, y: centerY + hPx / 2 }; // (50, 115)

  // V2 피벗 점(110, 65) 중심 180도 회전 연산
  let rotAngleRad = 0;
  let ghostOpacity = 0;
  let gapOffsetX = 0;
  let gapOffsetY = 0;

  if (stepIndex === 0) {
    rotAngleRad = 0;
    ghostOpacity = 0;
  } else if (stepIndex === 1) {
    // V2(점2) 피벗 중심으로 0도 -> 180도 부드러운 회전!
    rotAngleRad = eased * Math.PI;
    ghostOpacity = eased * 0.9;
  } else {
    // Step 2: 180도 회전 완료 후 절반(÷ 2) 분할 이격
    rotAngleRad = Math.PI;
    ghostOpacity = 0.85;
    gapOffsetX = eased * 12;
    gapOffsetY = eased * -8;
  }

  // V2 피벗 기준 2D 회전 함수
  const rotateAroundV2 = (p: Point, rad: number): Point => {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = p.x - v2.x;
    const dy = p.y - v2.y;
    return {
      x: v2.x + (dx * cos - dy * sin),
      y: v2.y + (dx * sin + dy * cos),
    };
  };

  // 복제 사다리꼴 회전 후 정점
  const gV1 = rotateAroundV2(v1, rotAngleRad);
  const gV2 = rotateAroundV2(v2, rotAngleRad);
  const gV3 = rotateAroundV2(v3, rotAngleRad);
  const gV4 = rotateAroundV2(v4, rotAngleRad);

  // 이격 오프셋 적용
  const gP1: Point = { x: gV1.x + gapOffsetX, y: gV1.y + gapOffsetY };
  const gP2: Point = { x: gV2.x + gapOffsetX, y: gV2.y + gapOffsetY };
  const gP3: Point = { x: gV3.x + gapOffsetX, y: gV3.y + gapOffsetY };
  const gP4: Point = { x: gV4.x + gapOffsetX, y: gV4.y + gapOffsetY };

  let badgeName = '1. 사다리꼴 (a=6, b=10, h=6)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        윗변 <strong>a={topA}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        아랫변 <strong>b={bottomB}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        높이 <strong>h={heightH}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. V2 피벗 180° 회전 ➔ 평행사변형';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          사다리꼴 180° 회전 결합! (밑변 = a + b = {topA} + {bottomB} = {paralBase})
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 절반(÷ 2) 넓이 계산';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          ({topA} + {bottomB}) × {heightH} ÷ 2
        </span>
        <span className="geo-divider">=</span>
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          {paralBase} × {heightH} ÷ 2
        </span>
        <span className="geo-divider">=</span>
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
        {/* Step 1~2: V2 피벗 180도 회전하는 복제 사다리꼴 */}
        {ghostOpacity > 0.01 && (
          <g style={{ opacity: ghostOpacity }}>
            <polygon
              points={`${gP1.x.toFixed(1)},${gP1.y.toFixed(1)} ${gP2.x.toFixed(1)},${gP2.y.toFixed(1)} ${gP3.x.toFixed(1)},${gP3.y.toFixed(1)} ${gP4.x.toFixed(1)},${gP4.y.toFixed(1)}`}
              fill="rgba(244, 63, 94, 0.3)"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray={stepIndex === 2 ? '4 3' : 'none'}
            />
          </g>
        )}

        {/* 원본 사다리꼴 */}
        <polygon
          points={`${v1.x},${v1.y} ${v2.x},${v2.y} ${v3.x},${v3.y} ${v4.x},${v4.y}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(h) 수직 점선 */}
        <line
          x1={v1.x}
          y1={v1.y}
          x2={v1.x}
          y2={v4.y}
          stroke="#fb7185"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <path
          d={`M ${v1.x} ${v4.y - 8} L ${v1.x + 8} ${v4.y - 8} L ${v1.x + 8} ${v4.y}`}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.5}
        />

        {/* 테두리 Line */}
        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} className="geo-edge-animated-line" />
        <line x1={v2.x} y1={v2.y} x2={v3.x} y2={v3.y} className="geo-edge-animated-line" />
        <line x1={v3.x} y1={v3.y} x2={v4.x} y2={v4.y} className="geo-edge-animated-line" />
        <line x1={v4.x} y1={v4.y} x2={v1.x} y2={v1.y} className="geo-edge-animated-line" />

        {/* 꼭짓점 Dots 및 명명 */}
        <circle cx={v1.x} cy={v1.y} r={4.5} fill="#c084fc" />
        <text
          x={v1.x}
          y={v1.y - 8}
          fill="#c084fc"
          fontSize={10}
          fontWeight={900}
          textAnchor="middle"
        >
          점1
        </text>

        {/* 피벗 회전 중심 점2 강조 */}
        <circle cx={v2.x} cy={v2.y} r={6} fill="#fb7185" stroke="#ffffff" strokeWidth={2} />
        <text
          x={v2.x + 4}
          y={v2.y - 8}
          fill="#fb7185"
          fontSize={10}
          fontWeight={900}
          textAnchor="middle"
        >
          점2 (피벗)
        </text>

        <circle cx={v3.x} cy={v3.y} r={4.5} fill="#38bdf8" />
        <text x={v3.x + 14} y={v3.y + 4} fill="#38bdf8" fontSize={10} fontWeight={900}>
          점3
        </text>

        <circle cx={v4.x} cy={v4.y} r={4.5} fill="#38bdf8" />
        <text x={v4.x - 14} y={v4.y + 4} fill="#38bdf8" fontSize={10} fontWeight={900}>
          점4
        </text>

        {/* 치수 라벨 */}
        <text
          x={(v1.x + v2.x) / 2}
          y={v1.y - 8}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          a={topA}
        </text>
        <text
          x={(v4.x + v3.x) / 2}
          y={v4.y + 18}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          b={bottomB}
        </text>
        <text
          x={v1.x - 16}
          y={centerY + 4}
          fill="#fb7185"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          h={heightH}
        </text>

        {/* Step 2 절반 분할 표시 */}
        {stepIndex === 2 && (
          <text x={100} y={30} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
            ÷ 2 (절반)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L7 Trapezoid Pivot Rotation Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel7Visualizer.displayName = 'ManimLevel7Visualizer';
