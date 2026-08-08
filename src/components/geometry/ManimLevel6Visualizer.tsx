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

// Level 6: 삼각형 넓이 (꼭짓점 도트 완전 제거 & L4 동일 보라 반투명 면색 + Cyan 테두리)
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // 원본 삼각형 꼭짓점 좌표 (SVG 200x165 상자 내 정중앙 배치)
  // 점1: 상단 (77, 50)
  // 점2: 우하단 (100, 130)
  // 점3: 좌하단 (10, 130)  -> 밑변 90px (b=12), 높이 80px (h=8)
  const p1: Point = { x: 77, y: 50 };
  const p2: Point = { x: 100, y: 130 };
  const p3: Point = { x: 10, y: 130 };

  const baseVal = 12;
  const heightVal = 8;
  const areaVal = (baseVal * heightVal) / 2; // 48

  // 오른쪽 빗변 변1-2에 복제 삼각형 결합 시 완성되는 평행사변형 꼭짓점 점4: (167, 50)
  const targetP4: Point = { x: 167, y: 50 };

  // -------------------------------------------------------------
  // 복제 삼각형 (2'-1'-3') 피봇 이동 회전
  // -------------------------------------------------------------
  let ghostP1: Point = { ...p1 };
  let ghostP2: Point = { ...p2 };
  let ghostP4: Point = { ...targetP4 };
  let ghostOpacity = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
  } else if (stepIndex === 1) {
    ghostOpacity = 0.9;
    const angleRad = eased * Math.PI;

    // 점2' 의 현재 위치 (변1-2 선분 상의 보간 좌표: 점2 -> 점1)
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

    ghostP2 = center2Prime; // 점2'
    ghostP1 = rotateRel(p1); // 점1' (t=1 시 점2와 일치)
    ghostP4 = rotateRel(p3); // 점3' (t=1 시 targetP4 과 일치)
  } else {
    // Step 2: 절반(÷ 2) 분할 이격
    ghostOpacity = 0.85;
    const offset = eased * 8;
    ghostP1 = { x: p2.x + offset, y: p2.y - offset };
    ghostP2 = { x: p1.x + offset, y: p1.y - offset };
    ghostP4 = { x: targetP4.x + offset, y: targetP4.y - offset };
  }

  // 카드 타이틀 & 캡션 구성
  let badgeName = '1. 삼각형 (b=12, h=8)';
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
    badgeName = '2. 180° 회전 결합 ➔ 평행사변형';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#c084fc', fontWeight: 800 }}>
          동일 삼각형 2개 합체! ➔ 평행사변형 완성
        </span>
      </div>
    );
  } else if (stepIndex === 2) {
    badgeName = '3. 절반(÷ 2) 넓이';
    caption = (
      <div className="geo-stat-highlights">
        <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
          {baseVal} × {heightVal}
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
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          {/* 복제 삼각형 (보랏빛/핑크 계열 반투명 fill + 퍼플 stroke) */}
          {ghostOpacity > 0.01 && (
            <polygon
              points={`${ghostP2.x.toFixed(1)},${ghostP2.y.toFixed(1)} ${ghostP1.x.toFixed(1)},${ghostP1.y.toFixed(1)} ${ghostP4.x.toFixed(1)},${ghostP4.y.toFixed(1)}`}
              fill="rgba(192, 132, 252, 0.28)"
              stroke="#c084fc"
              strokeWidth={2}
              strokeDasharray={stepIndex === 2 ? '4 3' : 'none'}
              style={{ opacity: ghostOpacity }}
            />
          )}

          {/* 원본 삼각형 (L4 이전과 동일한 은은한 보라 반투명 fill + Cyan 하늘색 stroke) */}
          <polygon
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
            fill="rgba(168, 85, 247, 0.22)"
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

          {/* Step 2 절반 분할 표시 */}
          {stepIndex === 2 && (
            <text x={100} y={28} fill="#4ade80" fontSize={12} fontWeight={900} textAnchor="middle">
              ÷ 2 (절반)
            </text>
          )}

          {isAdminMode && (
            <text x={10} y={158} fill="rgba(255,255,255,0.4)" fontSize={9}>
              [DEBUG] L6 Triangle 3B1B Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
