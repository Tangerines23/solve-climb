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

// 회전 변환 헬퍼 (Pivot 중심 theta 라디안 회전)
function rotatePoint(pt: Point, pivot: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = pt.x - pivot.x;
  const dy = pt.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

// Level 6: 삼각형 넓이 ((B * H) / 2) 3B1B 힌지 회전 모핑 애니메이션
// Step 0: 원본 삼각형 (점 1, 점 2, 점 3) 및 밑변 B=12, 높이 H=8 강조
// Step 1: 똑같은 2번째 삼각형 복제 생성
// Step 2: 변 1-2 중점 M_12 기준 180도 부드러운 힌지 회전 -> 평행사변형 완성!
// Step 3: 절반(÷ 2) 분할 이격 하이라이트 ((12 * 8) ÷ 2 = 48 입증)
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 4,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  const baseVal = 12;
  const heightVal = 8;
  const areaVal = (baseVal * heightVal) / 2; // 48

  // 원본 삼각형 좌표 (SVG 뷰포트 200x165 중앙 배치)
  // 점 1 (최상단), 점 2 (우하단), 점 3 (좌하단)
  const p1: Point = { x: 95, y: 45 };
  const p2: Point = { x: 125, y: 115 };
  const p3: Point = { x: 35, y: 115 };

  // 변 1-2 의 중점 (회전축 Pivot)
  const m12: Point = {
    x: (p1.x + p2.x) / 2, // 110
    y: (p1.y + p2.y) / 2, // 80
  };

  // Step 1~3 복제 삼각형의 위치 & 회전 각도 계산
  let ghostOpacity = 0;
  let currentAngle = 0; // 라디안
  let slideX = 0;
  let slideY = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
    currentAngle = 0;
  } else if (stepIndex === 1) {
    // Step 1: 동일 위치 복제 생성 (opacity 0 -> 0.85)
    ghostOpacity = eased * 0.85;
    currentAngle = 0;
  } else if (stepIndex === 2) {
    // Step 2: 중점 m12 기준으로 0도 -> 180도(PI) 부드럽게 힌지 회전!
    ghostOpacity = 0.9;
    currentAngle = eased * Math.PI;
  } else {
    // Step 3: 180도 회전 완료 후 절반(÷ 2) 이격 슬라이드
    ghostOpacity = 0.85;
    currentAngle = Math.PI;
    slideX = eased * 10;
    slideY = eased * -8;
  }

  // 복제 삼각형 점 1, 점 2, 점 3 의 회전 후 좌표
  const rot1 = rotatePoint(p1, m12, currentAngle);
  const rot2 = rotatePoint(p2, m12, currentAngle);
  const rot3 = rotatePoint(p3, m12, currentAngle);

  // 이격 이동 적용
  const gP1: Point = { x: rot1.x + slideX, y: rot1.y + slideY };
  const gP2: Point = { x: rot2.x + slideX, y: rot2.y + slideY };
  const gP3: Point = { x: rot3.x + slideX, y: rot3.y + slideY };

  let badgeName = '1. 삼각형 (밑변 B=12, 높이 H=8)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑변 <strong>B={baseVal}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        높이 <strong>H={heightVal}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 동일 위치 복제 생성';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#f43f5e', fontWeight: 800 }}>
          동일한 삼각형 1개 복제!
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 변 1-2 중점 기준 180° 회전 ➔ 평행사변형';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          평행사변형 완성! (밑변 = {baseVal}, 높이 = {heightVal})
        </span>
      </div>
    );
  } else if (stepIndex === 3) {
    badgeName = '4. 절반(÷ 2) 넓이 계산';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          {baseVal} × {heightVal} ÷ 2
        </span>
        <span className="geo-divider">=</span>
        <span className="geo-stat-item" style={{ color: '#4ade80', fontWeight: 900 }}>
          삼각형 넓이{' '}
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
        {/* Step 1~3: 180도 회전 복제 삼각형 */}
        {ghostOpacity > 0.01 && (
          <polygon
            points={`${gP1.x.toFixed(1)},${gP1.y.toFixed(1)} ${gP2.x.toFixed(1)},${gP2.y.toFixed(1)} ${gP3.x.toFixed(1)},${gP3.y.toFixed(1)}`}
            fill="rgba(244, 63, 94, 0.3)"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray={stepIndex === 3 ? '4 3' : 'none'}
            style={{ opacity: ghostOpacity }}
          />
        )}

        {/* 원본 삼각형 */}
        <polygon
          points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(H) 수직 점선 */}
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p1.x}
          y2={p3.y}
          stroke="#fb7185"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <path
          d={`M ${p1.x} ${p3.y - 8} L ${p1.x + 8} ${p3.y - 8} L ${p1.x + 8} ${p3.y}`}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.5}
        />

        {/* 테두리 Line */}
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="geo-edge-animated-line" />
        <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} className="geo-edge-animated-line" />
        <line x1={p3.x} y1={p3.y} x2={p1.x} y2={p1.y} className="geo-edge-animated-line" />

        {/* 변 1-2 중점 (Pivot Point M_12) 회전축 표시 */}
        {(stepIndex === 1 || stepIndex === 2) && (
          <circle cx={m12.x} cy={m12.y} r={5.5} fill="#fb7185" stroke="#ffffff" strokeWidth={1.5} />
        )}

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
          style={{ fill: '#38bdf8' }}
        />
        <circle
          cx={p3.x}
          cy={p3.y}
          r={4.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />

        {/* 꼭짓점 번호 라벨 (점 1, 점 2, 점 3) */}
        <text
          x={p1.x}
          y={p1.y - 8}
          fill="#c084fc"
          fontSize={11}
          fontWeight={900}
          textAnchor="middle"
        >
          점1
        </text>
        <text x={p2.x + 10} y={p2.y + 4} fill="#38bdf8" fontSize={11} fontWeight={900}>
          점2
        </text>
        <text
          x={p3.x - 10}
          y={p3.y + 4}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={900}
          textAnchor="end"
        >
          점3
        </text>

        {/* 수치 라벨 */}
        <text
          x={(p3.x + p2.x) / 2}
          y={p3.y + 18}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          밑변 (B={baseVal})
        </text>
        <text
          x={p1.x - 16}
          y={(p1.y + p3.y) / 2}
          fill="#fb7185"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          H={heightVal}
        </text>

        {/* Step 3 절반 분할 표시 */}
        {stepIndex === 3 && (
          <text x={110} y={30} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
            ÷ 2 (절반)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L6 Triangle 180deg Pivot Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
