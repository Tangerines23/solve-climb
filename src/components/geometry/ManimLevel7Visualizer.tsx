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

// Level 7: 사다리꼴 넓이 ((a + b) * h / 2) 3B1B 수학적 기하 애니메이션
// Step 0: 원본 사다리꼴 (윗변 a, 아랫변 b, 높이 h 강조)
// Step 1: 똑같은 2번째 사다리꼴 180도 회전 결합 (평행사변형 완성)
// Step 2: 절반(÷ 2) 분할 이격 강조 ((a + b) * h / 2 공식 도출)
export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200, // 형태 완성 후 2.2초 대기
    moveDuration: 1500, // 부드러운 1.5초 변형 애니메이션
  });

  const eased = getEasedProgress();

  // 사다리꼴 1 수치
  const topA = 6;
  const bottomB = 10;
  const heightH = 6;
  const areaVal = ((topA + bottomB) * heightH) / 2; // 48

  // 좌표 세팅 (원점 기준 중앙 정렬)
  const topW = 60;
  const bottomW = 100;
  const hPx = 60;
  const centerY = 90;

  // 원본 사다리꼴 4개 꼭짓점
  // p1: 윗변 좌, p2: 윗변 우, p3: 아랫변 우, p4: 아랫변 좌
  const p1: Point = { x: 100 - topW / 2, y: centerY - hPx / 2 };
  const p2: Point = { x: 100 + topW / 2, y: centerY - hPx / 2 };
  const p3: Point = { x: 100 + bottomW / 2, y: centerY + hPx / 2 };
  const p4: Point = { x: 100 - bottomW / 2, y: centerY + hPx / 2 };

  // 복제 사다리꼴 (180도 회전 결합) 계산
  let ghostOpacity = 0;
  let ghostOffsetX = 0;
  let ghostOffsetY = 0;

  if (stepIndex === 0) {
    ghostOpacity = eased * 0.9;
    ghostOffsetX = (1 - eased) * 15;
    ghostOffsetY = (1 - eased) * -15;
  } else if (stepIndex === 1) {
    ghostOpacity = 0.9;
    ghostOffsetX = eased * 6;
    ghostOffsetY = eased * -6;
  } else {
    ghostOpacity = 0.85;
    ghostOffsetX = 6;
    ghostOffsetY = -6;
  }

  // 180도 회전 복제 사다리꼴 정점 (오른쪽 변 p2-p3에 결합)
  // g1 = p3, g2 = p2, g3 = p2 + (p4 - p1), g4 = p3 + (p4 - p1)
  const shiftVec = { x: p4.x - p1.x, y: p4.y - p1.y };

  const gP1: Point = { x: p3.x + ghostOffsetX, y: p3.y + ghostOffsetY };
  const gP2: Point = { x: p2.x + ghostOffsetX, y: p2.y + ghostOffsetY };
  const gP3: Point = { x: p2.x + shiftVec.x + ghostOffsetX, y: p2.y + shiftVec.y + ghostOffsetY };
  const gP4: Point = { x: p3.x + shiftVec.x + ghostOffsetX, y: p3.y + shiftVec.y + ghostOffsetY };

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
    badgeName = '2. 똑같은 사다리꼴 2개 합체!';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          평행사변형 완성! (밑변 = a + b = {topA + bottomB})
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 절반(÷ 2)으로 분할!';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          ({topA} + {bottomB}) × {heightH}
        </span>
        <span className="geo-divider">÷ 2 =</span>
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
        {/* 복제 사다리꼴 (180도 회전 결합 평행사변형) */}
        {ghostOpacity > 0.01 && (
          <polygon
            points={`${gP1.x.toFixed(1)},${gP1.y.toFixed(1)} ${gP2.x.toFixed(1)},${gP2.y.toFixed(1)} ${gP3.x.toFixed(1)},${gP3.y.toFixed(1)} ${gP4.x.toFixed(1)},${gP4.y.toFixed(1)}`}
            fill={`rgba(244, 63, 94, ${0.35 * ghostOpacity})`}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray={stepIndex === 2 ? '4 3' : 'none'}
          />
        )}

        {/* 원본 사다리꼴 */}
        <polygon
          points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${p4.x.toFixed(1)},${p4.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(h) 수직 점선 */}
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p1.x}
          y2={p4.y}
          stroke="#fb7185"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <path
          d={`M ${p1.x} ${p4.y - 8} L ${p1.x + 8} ${p4.y - 8} L ${p1.x + 8} ${p4.y}`}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.5}
        />

        {/* 테두리 Line */}
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="geo-edge-animated-line" />
        <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} className="geo-edge-animated-line" />
        <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} className="geo-edge-animated-line" />
        <line x1={p4.x} y1={p4.y} x2={p1.x} y2={p1.y} className="geo-edge-animated-line" />

        {/* 꼭짓점 Dots */}
        <circle
          cx={p1.x}
          cy={p1.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#c084fc' }}
        />
        <circle
          cx={p2.x}
          cy={p2.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#c084fc' }}
        />
        <circle
          cx={p3.x}
          cy={p3.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />
        <circle
          cx={p4.x}
          cy={p4.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />

        {/* 치수 라벨 */}
        <text
          x={(p1.x + p2.x) / 2}
          y={p1.y - 8}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          윗변 (a=6)
        </text>
        <text
          x={(p4.x + p3.x) / 2}
          y={p4.y + 18}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          아랫변 (b=10)
        </text>
        <text
          x={p1.x - 18}
          y={centerY + 4}
          fill="#fb7185"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          높이(h)
        </text>

        {/* Step 2 분할 안내 표시 */}
        {stepIndex === 2 && (
          <text x={100} y={35} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
            ÷ 2 (절반)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L7 Trapezoid Doubling Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel7Visualizer.displayName = 'ManimLevel7Visualizer';
