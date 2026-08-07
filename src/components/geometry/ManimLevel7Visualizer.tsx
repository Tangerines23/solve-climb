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
// Step 0: 원본 사다리꼴 (윗변 a=6, 아랫변 b=10, 높이 h=6 강조)
// Step 1: 똑같은 2번째 사다리꼴 180도 회전 결합 (평행사변형 완벽 완성)
// Step 2: 절반(÷ 2) 분할 이격 하이라이트 ((a + b) * h / 2 공식 도출)
export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1500,
  });

  const eased = getEasedProgress();

  // 사다리꼴 1 수치
  const topA = 6;
  const bottomB = 10;
  const heightH = 6;
  const areaVal = ((topA + bottomB) * heightH) / 2; // 48

  // SVG 뷰포트(200x165) 중앙에 들어오도록 스케일링 된 좌표 세팅
  const topW = 45; // a = 6 비율
  const bottomW = 75; // b = 10 비율
  const hPx = 50; // h = 6 비율
  const centerY = 90;

  // 원본 사다리꼴 4개 꼭짓점
  // p1: 윗변 좌, p2: 윗변 우, p3: 아랫변 우, p4: 아랫변 좌
  const p1: Point = { x: 65, y: centerY - hPx / 2 }; // (65, 65)
  const p2: Point = { x: 65 + topW, y: centerY - hPx / 2 }; // (110, 65)
  const p3: Point = { x: 50 + bottomW, y: centerY + hPx / 2 }; // (125, 115)
  const p4: Point = { x: 50, y: centerY + hPx / 2 }; // (50, 115)

  // Step 1/2 복제 사다리꼴 (180도 회전 결합 및 이격) 애니메이션 오프셋
  let ghostOpacity = 0;
  let shiftX = 0;
  let shiftY = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
    shiftX = 20;
    shiftY = -15;
  } else if (stepIndex === 1) {
    // 180도 회전하여 빗변 p2-p3에 착 붙음
    ghostOpacity = eased * 0.9;
    shiftX = (1 - eased) * 15;
    shiftY = (1 - eased) * -10;
  } else {
    // Step 2: 절반(÷ 2) 분할 이격 강조 (사선으로 살짝 떨어짐)
    ghostOpacity = 0.85;
    shiftX = eased * 12;
    shiftY = eased * -8;
  }

  // 180도 회전 복제 사다리꼴 정점 (오른쪽 변 p2-p3에 결합)
  // g1 = p3, g2 = p2, g3 = p2 + (p3 - p4), g4 = p3 + (p2 - p1)
  const gP1: Point = { x: p3.x + shiftX, y: p3.y + shiftY };
  const gP2: Point = { x: p2.x + shiftX, y: p2.y + shiftY };
  const gP3: Point = { x: p2.x + bottomW + shiftX, y: p2.y + shiftY }; // 윗변 연장 (b=75px)
  const gP4: Point = { x: p3.x + topW + shiftX, y: p3.y + shiftY }; // 아랫변 연장 (a=45px)

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
          <g style={{ opacity: ghostOpacity }}>
            <polygon
              points={`${gP1.x.toFixed(1)},${gP1.y.toFixed(1)} ${gP2.x.toFixed(1)},${gP2.y.toFixed(1)} ${gP3.x.toFixed(1)},${gP3.y.toFixed(1)} ${gP4.x.toFixed(1)},${gP4.y.toFixed(1)}`}
              fill="rgba(244, 63, 94, 0.3)"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray={stepIndex === 2 ? '4 3' : 'none'}
            />
            {/* 복제 사다리꼴 치수 표시 */}
            {stepIndex === 1 && (
              <>
                <text x={(gP2.x + gP3.x) / 2} y={gP2.y - 6} fill="#f43f5e" fontSize={10} fontWeight={800} textAnchor="middle">
                  b (아랫변)
                </text>
                <text x={(gP1.x + gP4.x) / 2} y={gP1.y + 16} fill="#f43f5e" fontSize={10} fontWeight={800} textAnchor="middle">
                  a (윗변)
                </text>
              </>
            )}
          </g>
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
        <circle cx={p1.x} cy={p1.y} r={4.5} className="geo-simple-dot" style={{ fill: '#c084fc' }} />
        <circle cx={p2.x} cy={p2.y} r={4.5} className="geo-simple-dot" style={{ fill: '#c084fc' }} />
        <circle cx={p3.x} cy={p3.y} r={4.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />
        <circle cx={p4.x} cy={p4.y} r={4.5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />

        {/* 원본 치수 라벨 */}
        <text x={(p1.x + p2.x) / 2} y={p1.y - 8} fill="#38bdf8" fontSize={11} fontWeight={800} textAnchor="middle">
          윗변 (a=6)
        </text>
        <text x={(p4.x + p3.x) / 2} y={p4.y + 18} fill="#38bdf8" fontSize={11} fontWeight={800} textAnchor="middle">
          아랫변 (b=10)
        </text>
        <text x={p1.x - 16} y={centerY + 4} fill="#fb7185" fontSize={11} fontWeight={800} textAnchor="middle">
          높이(h)
        </text>

        {/* Step 2 분할 안내 표시 */}
        {stepIndex === 2 && (
          <text x={100} y={30} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
            ÷ 2 (절반 분할)
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
