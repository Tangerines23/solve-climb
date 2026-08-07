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

// Level 6: 삼각형 넓이 ((b * h) / 2) 3B1B [제시 1: 피봇 점 중심 180도 회전 결합] 애니메이션
// 꼭짓점 명명: 최상단 = 점1 (100, 55), 우하단 = 점2 (145, 125), 좌하단 = 점3 (55, 125)
// Step 0: 원본 삼각형 (밑변 b=12, 높이 h=8)
// Step 1: 동일 위치에 복제 삼각형 나타남
// Step 2: 점2(우하단 꼭짓점)를 피봇 축으로 180도 회전하여 변1-2 빗변 결합 -> 평행사변형 완성
// Step 3: 절반(÷ 2) 분할 이격 및 넓이 공식 (12 * 8 ÷ 2 = 48) 도출
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 4,
    holdDuration: 2200, // 각 단계 완료 후 2.2초 정지 관찰 딜레이
    moveDuration: 1500, // 1.5초 부드러운 회전 결합 변형
  });

  const eased = getEasedProgress();

  const baseVal = 12;
  const heightVal = 8;
  const areaVal = (baseVal * heightVal) / 2; // 48

  // 원본 삼각형 좌표 (SVG 뷰포트 200x165 안에서 평행사변형 완성 시 화면을 넘지 않도록 조율)
  // 점1 (상단), 점2 (우하단), 점3 (좌하단)
  const p1: Point = { x: 100, y: 55 }; // 점1
  const p2: Point = { x: 145, y: 125 }; // 점2 (피봇 중심점)
  const p3: Point = { x: 55, y: 125 }; // 점3

  // 제시 1: 점2(145, 125) 중심 180도 회전 계산
  // 회전 각도: Step 0/1: 0도 -> Step 2: 180도 회전 -> Step 3: 180도 고정
  let rotAngleRad = 0;
  let ghostOpacity = 0;
  let shiftX = 0;
  let shiftY = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
    rotAngleRad = 0;
  } else if (stepIndex === 1) {
    // 동일 위치에 복제본 서서히 나타남 (회전각 0도)
    ghostOpacity = eased * 0.9;
    rotAngleRad = 0;
  } else if (stepIndex === 2) {
    // 점2 중심 0도 -> 180도 회전 결합
    ghostOpacity = 0.9;
    rotAngleRad = eased * Math.PI;
  } else {
    // Step 3: 회전 완료(180도) 상태에서 사선 분할 이격 (shiftX=10, shiftY=-8)
    ghostOpacity = 0.85;
    rotAngleRad = Math.PI;
    shiftX = eased * 10;
    shiftY = eased * -8;
  }

  // 회전 변환 함수 (점2 피봇 축 기준)
  const rotatePointAboutP2 = (pt: Point, angle: number): Point => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const dx = pt.x - p2.x;
    const dy = pt.y - p2.y;
    return {
      x: p2.x + dx * cosA - dy * sinA + shiftX,
      y: p2.y + dx * sinA + dy * cosA + shiftY,
    };
  };

  // 복제 삼각형 꼭짓점 (점2 중심 회전)
  const gP1 = rotatePointAboutP2(p1, rotAngleRad); // 점1의 회전 위치
  const gP2 = rotatePointAboutP2(p2, rotAngleRad); // 점2 (피봇)
  const gP3 = rotatePointAboutP2(p3, rotAngleRad); // 점3의 회전 위치

  // 카드 뱃지 및 캡션 명세
  let badgeName = '1. 원본 삼각형 (b=12, h=8)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑변 <strong>b={baseVal}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        높이 <strong>h={heightVal}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 동일 위치에 복제';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#f43f5e', fontWeight: 800 }}>
          똑같은 삼각형 1개 더 생성!
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 점2 중심 180° 회전 ➔ 평행사변형';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          변1-2 결합! 평행사변형 (넓이 = {baseVal} × {heightVal} = {baseVal * heightVal})
        </span>
      </div>
    );
  } else if (stepIndex === 3) {
    badgeName = '4. 절반(÷ 2) 넓이 계산';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          ({baseVal} × {heightVal}) ÷ 2
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
        {/* Step 1~3: 점2 중심 180도 회전 복제 삼각형 (평행사변형 완성) */}
        {ghostOpacity > 0.01 && (
          <g style={{ opacity: ghostOpacity }}>
            <polygon
              points={`${gP1.x.toFixed(1)},${gP1.y.toFixed(1)} ${gP2.x.toFixed(1)},${gP2.y.toFixed(1)} ${gP3.x.toFixed(1)},${gP3.y.toFixed(1)}`}
              fill="rgba(244, 63, 94, 0.3)"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray={stepIndex === 3 ? '4 3' : 'none'}
            />
            {/* 복제 삼각형 정점 표시 */}
            <circle cx={gP3.x} cy={gP3.y} r={4.5} fill="#f43f5e" />
          </g>
        )}

        {/* 원본 삼각형 */}
        <polygon
          points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(h) 수직 점선 */}
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p1.x}
          y2={p3.y}
          stroke="#fb7185"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        {/* 직각 표시 */}
        <path
          d={`M ${p1.x} ${p3.y - 8} L ${p1.x - 8} ${p3.y - 8} L ${p1.x - 8} ${p3.y}`}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.5}
        />

        {/* 원본 삼각형 외곽 테두리 Line */}
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="geo-edge-animated-line" />
        <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} className="geo-edge-animated-line" />
        <line x1={p3.x} y1={p3.y} x2={p1.x} y2={p1.y} className="geo-edge-animated-line" />

        {/* 원본 꼭짓점 Dots & 라벨 (점1, 점2, 점3) */}
        <circle cx={p1.x} cy={p1.y} r={5} className="geo-simple-dot" style={{ fill: '#c084fc' }} />
        <circle cx={p2.x} cy={p2.y} r={5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />
        <circle cx={p3.x} cy={p3.y} r={5} className="geo-simple-dot" style={{ fill: '#38bdf8' }} />

        {/* 정점 이름 라벨 */}
        <text
          x={p1.x}
          y={p1.y - 8}
          fill="#c084fc"
          fontSize={10}
          fontWeight={900}
          textAnchor="middle"
        >
          점1
        </text>
        <text
          x={p2.x + 12}
          y={p2.y + 4}
          fill="#38bdf8"
          fontSize={10}
          fontWeight={900}
          textAnchor="middle"
        >
          점2
        </text>
        <text
          x={p3.x - 12}
          y={p3.y + 4}
          fill="#38bdf8"
          fontSize={10}
          fontWeight={900}
          textAnchor="middle"
        >
          점3
        </text>

        {/* 치수 라벨 (밑변 b, 높이 h) */}
        <text
          x={(p3.x + p2.x) / 2}
          y={p3.y + 18}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          밑변 (b=12)
        </text>
        <text
          x={p1.x - 16}
          y={(p1.y + p3.y) / 2}
          fill="#fb7185"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          높이(h)
        </text>

        {/* Step 3 절반 분할 표시 */}
        {stepIndex === 3 && (
          <text x={100} y={30} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
            ÷ 2 (절반)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L6 Proposal 1 Pivot Rotation Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
