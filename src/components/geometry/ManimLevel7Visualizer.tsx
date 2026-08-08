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

// Level 7: 사다리꼴 넓이 (L4와 100% 동일한 은은한 다크 보라 투명 fill rgba(147, 51, 234, 0.09))
export const ManimLevel7Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 4,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const topA = 6;
  const bottomB = 10;
  const heightH = 6;
  const paralBase = topA + bottomB; // 16
  const areaVal = (paralBase * heightH) / 2; // 48

  const topW = 45;
  const bottomW = 75;
  const hPx = 50;
  const centerY = 90;

  const p1: Point = { x: 50, y: centerY - hPx / 2 };
  const p2: Point = { x: 50 + topW, y: centerY - hPx / 2 };
  const p3: Point = { x: 40 + bottomW, y: centerY + hPx / 2 };
  const p4: Point = { x: 40, y: centerY + hPx / 2 };

  let gP1: Point = { ...p1 };
  let gP2: Point = { ...p2 };
  let gP3: Point = { ...p3 };
  let gP4: Point = { ...p4 };
  let ghostOpacity = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
  } else if (stepIndex === 1) {
    ghostOpacity = eased * 0.85;
    const shiftX = (1 - eased) * 15;
    const shiftY = (1 - eased) * -15;
    gP1 = { x: p1.x + shiftX, y: p1.y + shiftY };
    gP2 = { x: p2.x + shiftX, y: p2.y + shiftY };
    gP3 = { x: p3.x + shiftX, y: p3.y + shiftY };
    gP4 = { x: p4.x + shiftX, y: p4.y + shiftY };
  } else if (stepIndex === 2) {
    ghostOpacity = 0.9;
    const angleRad = eased * Math.PI;

    const pivot3Prime: Point = {
      x: p3.x + (p2.x - p3.x) * eased,
      y: p3.y + (p2.y - p3.y) * eased,
    };

    const rotateRel = (origPt: Point): Point => {
      const relX = origPt.x - p3.x;
      const relY = origPt.y - p3.y;
      const rx = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
      const ry = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);
      return {
        x: pivot3Prime.x + rx,
        y: pivot3Prime.y + ry,
      };
    };

    gP3 = pivot3Prime;
    gP2 = rotateRel(p2);
    gP1 = rotateRel(p1);
    gP4 = rotateRel(p4);
  } else {
    ghostOpacity = 0.85;
    const offset = eased * 8;
    gP3 = { x: p2.x + offset, y: p2.y - offset };
    gP2 = { x: p3.x + offset, y: p3.y - offset };
    gP1 = { x: p2.x + bottomW + offset, y: p2.y - offset };
    gP4 = { x: p3.x + topW + offset, y: p3.y - offset };
  }

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
      <span className="geo-stat-item" style={{ color: '#c084fc' }}>
        높이 <strong>h={heightH}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 똑같은 사다리꼴 복제';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          똑같은 사다리꼴 1개 더 생성!
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 180° 회전 결합 ➔ 평행사변형';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          평행사변형 완성! (밑변 = a + b = {topA} + {bottomB} = {paralBase})
        </span>
      </div>
    );
  } else if (stepIndex === 3) {
    badgeName = '4. 절반(÷ 2) 넓이 계산';
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
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          {/* 복제 사다리꼴 (은은하고 부드러운 보라 반투명 fill) */}
          {ghostOpacity > 0.01 && (
            <polygon
              points={`${gP1.x.toFixed(1)},${gP1.y.toFixed(1)} ${gP2.x.toFixed(1)},${gP2.y.toFixed(1)} ${gP3.x.toFixed(1)},${gP3.y.toFixed(1)} ${gP4.x.toFixed(1)},${gP4.y.toFixed(1)}`}
              fill="rgba(192, 132, 252, 0.16)"
              stroke="#c084fc"
              strokeWidth={2}
              strokeDasharray={stepIndex === 3 ? '4 3' : 'none'}
              style={{ opacity: ghostOpacity }}
            />
          )}

          {/* 원본 사다리꼴 (L4와 100% 동일하게 옅고 은은한 다크 보라 투명 rgba(147, 51, 234, 0.09) + Cyan stroke) */}
          <polygon
            points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${p4.x.toFixed(1)},${p4.y.toFixed(1)}`}
            fill="rgba(147, 51, 234, 0.09)"
            stroke="#38bdf8"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* 높이(h) 수직 점선 */}
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p1.x}
            y2={p4.y}
            stroke="#c084fc"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d={`M ${p1.x} ${p4.y - 8} L ${p1.x + 8} ${p4.y - 8} L ${p1.x + 8} ${p4.y}`}
            fill="none"
            stroke="#c084fc"
            strokeWidth={1.5}
          />

          {/* 원본 치수 라벨 */}
          <text
            x={(p1.x + p2.x) / 2}
            y={p1.y - 8}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            a={topA}
          </text>
          <text
            x={(p4.x + p3.x) / 2}
            y={p4.y + 18}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            b={bottomB}
          </text>
          <text
            x={p1.x - 16}
            y={centerY + 4}
            fill="#c084fc"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            h={heightH}
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
