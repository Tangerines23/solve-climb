import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { useManimEngine } from './useManimEngine';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';

const SIZE = 200;

interface Point {
  x: number;
  y: number;
}

type ProposalType = 0 | 1 | 2; // 0: 제시 1, 1: 제시 2, 2: 제시 3

const PROPOSAL_NAMES = [
  '제시 1: 피봇 이동 회전',
  '제시 2: 점4 직선 이동',
  '제시 3: 빗변 축 경첩 반사',
];

// Level 6: 삼각형 넓이 (3B1B 평행사변형 합성 애니메이션 - 제시 1, 2, 3 정밀 구현)
// 방향키 (←, →) 누르면 1.5초 토스트 메시지로 제시안 변경 안내
export const ManimLevel6Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);
  const [proposal, setProposal] = useState<ProposalType>(0);

  // 방향키 이동 시 1.5초 토스트 메시지 노출 state
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (text: string) => {
    setToastText(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastText(null);
    }, 1500);
  };

  const { stepIndex, isPaused, togglePause, getEasedProgress } = useManimEngine({
    totalSteps: 3,
    holdDuration: 2200,
    moveDuration: 1600,
  });

  const eased = getEasedProgress();

  // 방향키 (←, →) 전환 이벤트 처리 & 토스트 트리거
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setProposal((prev) => {
        const next = ((prev - 1 + 3) % 3) as ProposalType;
        triggerToast(PROPOSAL_NAMES[next]);
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      setProposal((prev) => {
        const next = ((prev + 1) % 3) as ProposalType;
        triggerToast(PROPOSAL_NAMES[next]);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [handleKeyDown]);

  // 삼각형 정점 고정 좌표
  // 점1: 최상단 (125, 50)
  // 점2: 우하단 (155, 130)
  // 점3: 좌하단 (35, 130)
  const p1: Point = { x: 125, y: 50 };
  const p2: Point = { x: 155, y: 130 };
  const p3: Point = { x: 35, y: 130 };

  const baseVal = 12;
  const heightVal = 8;
  const areaVal = (baseVal * heightVal) / 2; // 48

  // 올바른 평행사변형 3-2-1-4 의 4번째 꼭짓점 점4 좌표: (5, 50)
  // 점4 = 점1 + (점3 - 점2) = (125 - 120, 50) = (5, 50)
  const targetP4: Point = { x: 5, y: 50 };

  // -------------------------------------------------------------
  // 복제 삼각형 (1-3-4) 꼭짓점 좌표 계산
  // -------------------------------------------------------------
  let ghostP1: Point = { ...p1 };
  let ghostP3: Point = { ...p3 };
  let ghostP4: Point = { ...targetP4 };
  let ghostOpacity = 0;

  if (stepIndex === 0) {
    ghostOpacity = 0;
  } else if (stepIndex === 1) {
    ghostOpacity = 0.9;

    if (proposal === 0) {
      // ---------------------------------------------------------
      // [제시 1: 이동하는 피봇 회전]
      // 점2에서 시작하여 점1로 피봇 이동하면서 180도 회전
      // ---------------------------------------------------------
      const angleRad = eased * Math.PI; // 0 -> 180도
      const pivot: Point = {
        x: p2.x + (p1.x - p2.x) * eased,
        y: p2.y + (p1.y - p2.y) * eased,
      };

      const rotatePt = (pt: Point): Point => {
        const dx = pt.x - pivot.x;
        const dy = pt.y - pivot.y;
        const rx = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const ry = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
        return { x: pivot.x + rx, y: pivot.y + ry };
      };

      ghostP1 = rotatePt(p1);
      ghostP3 = rotatePt(p3);
      ghostP4 = rotatePt(p2);
    } else if (proposal === 1) {
      // ---------------------------------------------------------
      // [제시 2: 점4 직선 이동 (Paper Unfolding)]
      // 점4를 원본 점2(155, 130) 위치에 겹쳐 생성 후, 목표 점4(5, 50)로 직선 이동
      // 복제 삼각형 = (점1, 점3, 점4)
      // ---------------------------------------------------------
      ghostP1 = { ...p1 };
      ghostP3 = { ...p3 };
      ghostP4 = {
        x: p2.x + (targetP4.x - p2.x) * eased,
        y: p2.y + (targetP4.y - p2.y) * eased,
      };
    } else if (proposal === 2) {
      // ---------------------------------------------------------
      // [제시 3: 빗변 축(변1-3) 경첩 반사]
      // 빗변 변1-3을 경첩 축으로 삼아 대칭 반사 폅침
      // ---------------------------------------------------------
      ghostP1 = { ...p1 };
      ghostP3 = { ...p3 };

      const flipAngle = (1 - eased) * Math.PI;
      ghostP4 = {
        x: p2.x + (targetP4.x - p2.x) * eased + Math.sin(flipAngle) * 15,
        y: p2.y + (targetP4.y - p2.y) * eased - Math.sin(flipAngle) * 20,
      };
    }
  } else {
    // Step 2: 절반(÷ 2) 분할 이격 (사선으로 오프셋)
    ghostOpacity = 0.85;
    const offset = eased * 8;
    ghostP1 = { x: p1.x - offset, y: p1.y - offset };
    ghostP3 = { x: p3.x - offset, y: p3.y - offset };
    ghostP4 = { x: targetP4.x - offset, y: targetP4.y - offset };
  }

  // 보라색 뱃지 타이틀에서 제시 문구 제거 -> 깨끗한 원래 텍스트로 복원
  let badgeName = '1. 삼각형 (b=12, h=8)';
  let caption = (
    <div className="geo-stat-highlights">
      <span className="geo-stat-item" style={{ color: '#38bdf8' }}>
        밑변(변3-2) <strong>b={baseVal}</strong>
      </span>
      <span className="geo-divider">,</span>
      <span className="geo-stat-item" style={{ color: '#fb7185' }}>
        높이 <strong>h={heightVal}</strong>
      </span>
    </div>
  );

  if (stepIndex === 1) {
    badgeName = '2. 평행사변형 완성!';
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
        {/* 방향키 이동 시 1.5초간 나타나는 토스트 메시지 */}
        {toastText && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              zIndex: 30,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '3px 12px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              pointerEvents: 'none',
              animation: 'fadeInOut 1.5s ease-in-out',
            }}
          >
            {toastText}
          </div>
        )}

        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          {/* 올바른 복제 삼각형 (점1, 점3, 점4) */}
          {ghostOpacity > 0.01 && (
            <g style={{ opacity: ghostOpacity }}>
              <polygon
                points={`${ghostP1.x.toFixed(1)},${ghostP1.y.toFixed(1)} ${ghostP3.x.toFixed(1)},${ghostP3.y.toFixed(1)} ${ghostP4.x.toFixed(1)},${ghostP4.y.toFixed(1)}`}
                fill="rgba(244, 63, 94, 0.3)"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray={stepIndex === 2 ? '4 3' : 'none'}
              />
              {/* 복제 꼭짓점 점4 위치 표기 */}
              <circle cx={ghostP4.x} cy={ghostP4.y} r={4.5} fill="#f43f5e" />
              <text
                x={ghostP4.x - 8}
                y={ghostP4.y - 6}
                fill="#f43f5e"
                fontSize={10}
                fontWeight={900}
              >
                점4
              </text>
            </g>
          )}

          {/* 원본 삼각형 (점1, 점2, 점3) */}
          <polygon
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
            className="geo-shape-poly-morph"
          />

          {/* 높이 점선 */}
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

          {/* 원본 꼭짓점 라벨 (점1, 점2, 점3) */}
          <circle cx={p1.x} cy={p1.y} r={4.5} fill="#c084fc" />
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

          <circle cx={p2.x} cy={p2.y} r={4.5} fill="#38bdf8" />
          <text x={p2.x + 10} y={p2.y + 4} fill="#38bdf8" fontSize={10} fontWeight={900}>
            점2
          </text>

          <circle cx={p3.x} cy={p3.y} r={4.5} fill="#38bdf8" />
          <text x={p3.x - 12} y={p3.y + 4} fill="#38bdf8" fontSize={10} fontWeight={900}>
            점3
          </text>

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
            fill="#fb7185"
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
              [DEBUG] L6 Triangle Proposal {proposal + 1} Visualizer
            </text>
          )}
        </svg>
      </div>
    </ManimCardLayout>
  );
});

ManimLevel6Visualizer.displayName = 'ManimLevel6Visualizer';
