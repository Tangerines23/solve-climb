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

// Level 6: 삼각형 넓이 (사용자 요청 5단계 명확 시퀀스 & 12*8=96 아래 ÷2=48 2줄 수식 배치)
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 5,
    holdDuration: 2000,
    moveDuration: 1500,
  });

  const eased = getEasedProgress();

  // 원본 삼각형 기준 좌표 (b=12 -> 90px, h=8 -> 80px)
  const baseP1: Point = { x: 67, y: 48 };
  const baseP2: Point = { x: 90, y: 128 };
  const baseP3: Point = { x: 0, y: 128 };
  const baseTargetP4: Point = { x: 157, y: 48 };

  const baseVal = 12;
  const heightVal = 8;
  const areaVal = (baseVal * heightVal) / 2; // 48
  const paralAreaVal = baseVal * heightVal; // 96

  // -------------------------------------------------------------
  // X축 중앙 배치 Shift 오프셋 계산
  // -------------------------------------------------------------
  let currentOffsetX = 55;

  if (stepIndex === 0) {
    currentOffsetX = 55;
  } else if (stepIndex === 1) {
    currentOffsetX = 55 + (21.5 - 55) * eased;
  } else if (stepIndex === 2 || stepIndex === 3) {
    currentOffsetX = 21.5;
  } else if (stepIndex === 4) {
    currentOffsetX = 21.5 + (55 - 21.5) * eased;
  }

  // Shift 적용 꼭짓점
  const p1: Point = { x: baseP1.x + currentOffsetX, y: baseP1.y };
  const p2: Point = { x: baseP2.x + currentOffsetX, y: baseP2.y };
  const p3: Point = { x: baseP3.x + currentOffsetX, y: baseP3.y };
  const targetP4: Point = { x: baseTargetP4.x + currentOffsetX, y: baseTargetP4.y };

  // -------------------------------------------------------------
  // 복제 삼각형 좌표 및 투명도
  // -------------------------------------------------------------
  let ghostP1: Point = { ...p1 };
  let ghostP2: Point = { ...p2 };
  let ghostP4: Point = { ...targetP4 };
  let ghostOpacity = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
  } else if (stepIndex === 1) {
    ghostOpacity = eased * 0.9;
    const angleRad = eased * Math.PI;

    const center2Prime: Point = {
      x: p2.x + (p1.x - p2.x) * eased,
      y: p2.y + (p1.y - p2.y) * eased,
    };

    const rotateRel = (origPt: Point): Point => {
      const relX = origPt.x - p2.x;
      const relY = origPt.y - p2.y;
      const rx = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
      const ry = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);
      return {
        x: center2Prime.x + rx,
        y: center2Prime.y + ry,
      };
    };

    ghostP2 = center2Prime;
    ghostP1 = rotateRel(p1);
    ghostP4 = rotateRel(p3);
  } else if (stepIndex === 2) {
    ghostOpacity = 0.9;
    ghostP1 = { ...p2 };
    ghostP2 = { ...p1 };
    ghostP4 = { ...targetP4 };
  } else if (stepIndex === 3) {
    ghostOpacity = 0.9 - eased * 0.75;
    const offset = eased * 12;
    ghostP1 = { x: p2.x + offset, y: p2.y - offset };
    ghostP2 = { x: p1.x + offset, y: p1.y - offset };
    ghostP4 = { x: targetP4.x + offset, y: targetP4.y - offset };
  } else if (stepIndex === 4) {
    ghostOpacity = 0;
  }

  // 카드 타이틀 & 캡션 5단계 구성
  let badgeName = '1. 삼각형';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑변 <strong>b={baseVal}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#c084fc' }}>
        높이 <strong>h={heightVal}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 이동/분할 평행사변형 완성';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          동일 삼각형 2개 합체! ➔ 평행사변형 완성
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 평행사변형 넓이';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          {baseVal} × {heightVal}
        </span>
        <span className="geo-divider">=</span>
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 900 }}>
          평행사변형 넓이 <strong>{paralAreaVal}</strong>
        </span>
      </div>
    );
  } else if (stepIndex === 3) {
    badgeName = '4. 절반(÷ 2) 분할 넓이';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          {baseVal} × {heightVal} ÷ 2
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
  } else if (stepIndex === 4) {
    badgeName = '5. 삼각형 넓이 완성';
    caption = (
      <div className="geo-stat-highlights">
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
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          <defs>
            {/* 복제 삼각형 교집합 배경색 투명 제거 마스크 */}
            <mask id="l6-ghost-diff-mask">
              <rect x="0" y="0" width={SIZE} height="165" fill="white" />
              <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill="black" />
            </mask>
          </defs>

          {/* 수식 표시 영역 (12 * 8 = 96 아래에 ÷ 2 = 48 2줄 구조 배치) */}
          {stepIndex >= 2 && (
            <g className="formula-group">
              {/* Line 1: 평행사변형 넓이 (12 × 8 = 96) */}
              <text
                x={100}
                y={22}
                fill="#c084fc"
                fontSize={11}
                fontWeight={900}
                textAnchor="middle"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
              >
                12 × 8 = 96
              </text>

              {/* Line 2: ÷ 2 = 48 (Step 3 이상에서 바로 1줄 수식 아래에 등장!) */}
              {stepIndex >= 3 && (
                <text
                  x={100}
                  y={37}
                  fill="#4ade80"
                  fontSize={12}
                  fontWeight={900}
                  textAnchor="middle"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                >
                  ÷ 2 = 48
                </text>
              )}
            </g>
          )}

          {/* 복제 삼각형 */}
          {ghostOpacity > 0.01 && (
            <g style={{ opacity: ghostOpacity }}>
              <polygon
                points={`${ghostP2.x.toFixed(1)},${ghostP2.y.toFixed(1)} ${ghostP1.x.toFixed(1)},${ghostP1.y.toFixed(1)} ${ghostP4.x.toFixed(1)},${ghostP4.y.toFixed(1)}`}
                fill="rgba(192, 132, 252, 0.35)"
                mask="url(#l6-ghost-diff-mask)"
              />
              <polygon
                points={`${ghostP2.x.toFixed(1)},${ghostP2.y.toFixed(1)} ${ghostP1.x.toFixed(1)},${ghostP1.y.toFixed(1)} ${ghostP4.x.toFixed(1)},${ghostP4.y.toFixed(1)}`}
                fill="none"
                stroke="#c084fc"
                strokeWidth={2}
                strokeDasharray={stepIndex >= 3 ? '4 3' : 'none'}
              />
            </g>
          )}

          {/* 원본 삼각형 */}
          <polygon
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#38bdf8"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* 높이 점선 */}
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p1.x}
            y2={p3.y}
            stroke="#c084fc"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <path
            d={`M ${p1.x} ${p3.y - 8} L ${p1.x + 8} ${p3.y - 8} L ${p1.x + 8} ${p3.y}`}
            fill="none"
            stroke="#c084fc"
            strokeWidth={1.5}
          />

          {/* 치수 라벨 */}
          <text
            x={(p3.x + p2.x) / 2}
            y={p3.y + 18}
            fill="#38bdf8"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            밑변 (b={baseVal})
          </text>
          <text
            x={p1.x - 16}
            y={(p1.y + p3.y) / 2}
            fill="#c084fc"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
          >
            높이 (h={heightVal})
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
