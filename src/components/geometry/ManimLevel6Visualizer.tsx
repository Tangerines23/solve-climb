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

// 스텝 정의
// Step 0: 원본 삼각형 단독 (밑변 b, 높이 h 강조)
// Step 1: 180도 회전한 동일 삼각형 결합 (평행사변형 완성)
// Step 2: 절반 분할 하이라이트 ((b * h) / 2 공식 도출)
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200, // 각 단계 완성 후 2.2초 정지 대기
    moveDuration: 1500, // 부드러운 1.5초 변형 애니메이션
  });

  const eased = getEasedProgress();

  // 원본 삼각형 좌표 (밑변 120px, 높이 80px)
  const top: Point = { x: 125, y: 50 };
  const left: Point = { x: 35, y: 130 };
  const right: Point = { x: 155, y: 130 };

  const baseVal = 12;
  const heightVal = 8;
  const areaVal = (baseVal * heightVal) / 2;

  // 복제 삼각형 목표 정점 (180도 회전 시 좌표: top + (right - left))
  const targetGhostTop: Point = {
    x: right.x + (top.x - left.x), // 155 + 90 = 245 -> 화면 내 조정을 위해 역방향 계산
    y: right.y + (top.y - left.y),
  };

  // 회전 결합 모핑 계산
  // Step 0 -> Step 1: 복제 삼각형이 나타나 원본 삼각형 빗변에 부드럽게 결합
  // Step 1 -> Step 2: 결합 상태에서 절반 분할 하이라이트 (살짝 이격)
  let ghostOpacity = 0;
  let ghostOffsetX = 0;
  let ghostOffsetY = 0;

  if (stepIndex === 0) {
    // Step 0 -> 1 로 갈 때 복제 삼각형 서서히 나타남
    ghostOpacity = eased * 0.9;
    ghostOffsetX = (1 - eased) * 20;
    ghostOffsetY = (1 - eased) * -20;
  } else if (stepIndex === 1) {
    // Step 1: 완전 결합 상태 (평행사변형)
    ghostOpacity = 0.9 + (1 - eased) * 0.0;
    // Step 1 -> 2 로 갈 때 살짝 이격 분할 애니메이션
    ghostOffsetX = eased * 6;
    ghostOffsetY = eased * -6;
  } else {
    // Step 2: 이격된 반 분할 강조 상태
    ghostOpacity = 0.85;
    ghostOffsetX = 6;
    ghostOffsetY = -6;
  }

  // 복제 삼각형 (180도 뒤집어진 삼각형) 좌표
  // V1_ghost = right, V2_ghost = top, V3_ghost = top + right - left
  const gV1: Point = { x: right.x + ghostOffsetX, y: right.y + ghostOffsetY };
  const gV2: Point = { x: top.x + ghostOffsetX, y: top.y + ghostOffsetY };
  const gV3: Point = {
    x: right.x + (top.x - left.x) + ghostOffsetX,
    y: top.y + ghostOffsetY,
  };

  // 단계별 뱃지 및 캡션 명세
  let badgeName = '1. 원본 삼각형';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑변 <strong className="highlight-num">{baseVal}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        높이 <strong className="highlight-num">{heightVal}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 똑같은 삼각형 2개 합체!';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          평행사변형 넓이 = {baseVal} × {heightVal} = {baseVal * heightVal}
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 반(÷ 2)으로 분할!';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          ({baseVal} × {heightVal})
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
        {/* Step 1 & 2: 180도 회전 결합된 복제 삼각형 (평행사변형 완성) */}
        {ghostOpacity > 0.01 && (
          <polygon
            points={`${gV1.x.toFixed(1)},${gV1.y.toFixed(1)} ${gV2.x.toFixed(1)},${gV2.y.toFixed(1)} ${gV3.x.toFixed(1)},${gV3.y.toFixed(1)}`}
            fill={`rgba(244, 63, 94, ${0.35 * ghostOpacity})`}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray={stepIndex === 2 ? '4 3' : 'none'}
          />
        )}

        {/* 메인 원본 삼각형 */}
        <polygon
          points={`${top.x.toFixed(1)},${top.y.toFixed(1)} ${left.x.toFixed(1)},${left.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)}`}
          className="geo-shape-poly-morph"
        />

        {/* 높이(h) 수직 점선 */}
        <line
          x1={top.x}
          y1={top.y}
          x2={top.x}
          y2={left.y}
          stroke="#fb7185"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        {/* 직각 표시 */}
        <path
          d={`M ${top.x} ${left.y - 8} L ${top.x - 8} ${left.y - 8} L ${top.x - 8} ${left.y}`}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.5}
        />

        {/* 원본 삼각형 외곽 테두리 Line */}
        <line x1={top.x} y1={top.y} x2={left.x} y2={left.y} className="geo-edge-animated-line" />
        <line
          x1={left.x}
          y1={left.y}
          x2={right.x}
          y2={right.y}
          className="geo-edge-animated-line"
        />
        <line x1={right.x} y1={right.y} x2={top.x} y2={top.y} className="geo-edge-animated-line" />

        {/* 꼭짓점 정점 (Vertices) */}
        <circle
          cx={top.x}
          cy={top.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#c084fc' }}
        />
        <circle
          cx={left.x}
          cy={left.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />
        <circle
          cx={right.x}
          cy={right.y}
          r={5.5}
          className="geo-simple-dot"
          style={{ fill: '#38bdf8' }}
        />

        {/* 복제 삼각형 정점 */}
        {ghostOpacity > 0.5 && (
          <circle
            cx={gV3.x}
            cy={gV3.y}
            r={5.5}
            className="geo-simple-dot"
            style={{ fill: '#f43f5e' }}
          />
        )}

        {/* 라벨 (밑변 b, 높이 h) */}
        <text
          x={(left.x + right.x) / 2}
          y={left.y + 18}
          fill="#38bdf8"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          밑변 (b)
        </text>
        <text
          x={top.x - 18}
          y={(top.y + left.y) / 2}
          fill="#fb7185"
          fontSize={11}
          fontWeight={800}
          textAnchor="middle"
        >
          높이 (h)
        </text>

        {/* Step 2 분할 안내 표시 */}
        {stepIndex === 2 && (
          <text x={100} y={35} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
            ÷ 2 (절반)
          </text>
        )}

        {isAdminMode && (
          <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
            [DEBUG] L6 Parallelogram Doubling Visualizer
          </text>
        )}
      </svg>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
