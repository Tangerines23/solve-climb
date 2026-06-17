import { useMemo } from 'react';
import { World, Category } from '../types/quiz';

interface BackgroundProps {
  world: World;
  category: Category;
  totalLevels?: number;
}

// 25개 부유 요소의 고유 seed 값 (컴포넌트 바깥에 배치하여 재생성 방지 및 DOM 유지)
const FLOATING_SEEDS = Array.from({ length: 25 }, (_, i) => {
  // 인덱스 기반으로 고정된 난수 값들을 결정론적으로 매핑
  const sin1 = Math.sin(i + 1) * 10000;
  const seedX = sin1 - Math.floor(sin1);
  const sin2 = Math.sin(i + 2.5) * 10000;
  const seedY = sin2 - Math.floor(sin2);
  const scale = 0.5 + (sin1 * 0.5 - Math.floor(sin1 * 0.5)); // 0.5 ~ 1.0
  const isSymbol = i % 2 === 0;

  return {
    id: `float-${i}`,
    seedX,
    seedY,
    scale,
    isSymbol,
    index: i,
  };
});

export function ClimbBackground({ category }: BackgroundProps) {
  // 카테고리별 수학적 대형(Layout) 좌표 계산
  const items = useMemo(() => {
    return FLOATING_SEEDS.map((seed) => {
      let x = seed.seedX * 100;
      let y = seed.seedY * 100;
      let scale = seed.scale;
      let rotate = 0;
      let opacity = seed.isSymbol ? 0.55 : 0.85;
      let symbol = '';

      if (category === '기초') {
        const symbols = ['+', '-', '×', '÷', '='];
        symbol = symbols[seed.index % symbols.length];
        x = seed.seedX * 90 + 5; // 골고루 분산
        y = seed.seedY * 90 + 5;
        scale = seed.scale * 0.9;
      } else if (category === '대수') {
        const symbols = ['x', 'y', 'a', 'b', 'z'];
        symbol = symbols[seed.index % symbols.length];
        // 대칭 협곡 대형: 중앙(35% ~ 65%)을 비우고 양옆에 집중적으로 배치
        if (seed.seedX < 0.5) {
          x = seed.seedX * 60; // 0% ~ 30%
        } else {
          x = 70 + (seed.seedX - 0.5) * 60; // 70% ~ 100%
        }
        y = seed.seedY * 95 + 2.5;
        rotate = seed.index * 15;
        scale = seed.scale * 0.8;
      } else if (category === '논리') {
        const symbols = ['>', '<', '1', '2', '3', '5', '8'];
        symbol = symbols[seed.index % symbols.length];
        // 피라미드 대형: 상단(y가 낮음)으로 갈수록 x가 중앙(50%)으로 좁아짐
        const yPercent = seed.seedY * 100;
        const spread = (yPercent / 100) * 80 + 10;
        x = 50 + (seed.seedX - 0.5) * spread;
        y = seed.seedY * 90 + 5;
        rotate = seed.index * 30;
      } else if (category === '심화') {
        const symbols = ['∫', '∞', '∂', 'dx', 'dy'];
        symbol = symbols[seed.index % symbols.length];
        // 사인파 나선 대형: S자 곡선을 따라 궤도 주변에 배치
        const yPercent = seed.seedY * 100;
        const sOffset = Math.sin(yPercent * 0.1) * 35;
        x = 50 + sOffset + (seed.seedX - 0.5) * 20;
        y = seed.seedY * 90 + 5;
        rotate = seed.index * 45;
        scale = seed.scale * 1.1;
      }

      return {
        ...seed,
        x,
        y,
        scale,
        rotate,
        opacity,
        symbol,
      };
    });
  }, [category]);

  // 대수와 심화 카테고리에서 모눈종이 그리드 투명도 설정
  const gridOpacity = category === '대수' || category === '심화' ? 0.6 : 0;
  // 대수 카테고리 등호 다리 투명도 설정
  const bridgeOpacity = category === '대수' ? 0.75 : 0;
  // 심화 카테고리 접선 투명도 설정
  const tangentOpacity = category === '심화' ? 0.45 : 0;
  // 심화 카테고리 잔별(Star) 투명도 설정
  const starOpacity = category === '심화' ? 0.8 : 0;

  return (
    <div
      data-vg-ignore="true"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 3겹의 미려한 단일 산 실루엣 & 카테고리별 특수 효과 레이어 SVG */}
      <svg
        viewBox="0 0 400 1200"
        className="mountain-background-svg"
        preserveAspectRatio="xMidYMax meet"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          {/* 모눈종이 패턴 */}
          <pattern id="climb-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--symbol-color-near)"
              strokeWidth="1"
              opacity="0.12"
            />
          </pattern>
        </defs>

        {/* 1. 모눈 그리드 배경 */}
        <rect
          width="400"
          height="1200"
          fill="url(#climb-grid)"
          style={{
            opacity: gridOpacity,
            transition: 'opacity 0.8s ease-in-out',
          }}
        />

        {/* 2. 대수 등호 연결 다리 */}
        <g
          style={{
            opacity: bridgeOpacity,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          {[200, 400, 600, 800, 1000].map((y, idx) => (
            <g key={`bridge-${idx}`}>
              <line
                x1="60"
                y1={y}
                x2="110"
                y2={y}
                stroke="var(--symbol-color-near)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <line
                x1="290"
                y1={y}
                x2="340"
                y2={y}
                stroke="var(--symbol-color-near)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <line
                x1="110"
                y1={y}
                x2="290"
                y2={y}
                stroke="var(--symbol-color-near)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.35"
              />
            </g>
          ))}
        </g>

        {/* 3. 심화 접선 기하학 라인 */}
        <g
          style={{
            opacity: tangentOpacity,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          <line
            x1="0"
            y1="150"
            x2="400"
            y2="280"
            stroke="var(--symbol-color-near)"
            strokeWidth="2"
            strokeDasharray="6,6"
          />
          <line
            x1="0"
            y1="550"
            x2="400"
            y2="420"
            stroke="var(--symbol-color-near)"
            strokeWidth="2"
            strokeDasharray="6,6"
          />
          <line
            x1="0"
            y1="950"
            x2="400"
            y2="880"
            stroke="var(--symbol-color-near)"
            strokeWidth="2"
            strokeDasharray="6,6"
          />
        </g>

        {/* 4. Far Mountain (먼 산) */}
        <path
          d="M 0,1200 L 0,420 Q 90,340 190,440 T 400,380 L 400,1200 Z"
          fill="var(--ground-color-far)"
          className="mountain-bg-far"
          style={{
            opacity: 0.38,
            transition: 'fill 0.8s ease-in-out',
          }}
        />

        {/* 5. Mid Mountain (중간 산) */}
        <path
          d="M 0,1200 L 0,640 Q 110,710 210,610 T 400,680 L 400,1200 Z"
          fill="var(--ground-color-mid)"
          className="mountain-bg-mid"
          style={{
            opacity: 0.65,
            transition: 'fill 0.8s ease-in-out',
          }}
        />

        {/* 6. Near Mountain (가까운 산) */}
        <path
          d="M 0,1200 L 0,860 Q 100,800 200,900 T 400,820 L 400,1200 Z"
          fill="var(--ground-color-near)"
          className="mountain-bg-near"
          style={{
            opacity: 0.88,
            transition: 'fill 0.8s ease-in-out',
          }}
        />
      </svg>

      {/* 심화 전용 빛나는 잔별들 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: starOpacity,
          transition: 'opacity 0.8s ease-in-out',
        }}
      >
        {FLOATING_SEEDS.slice(0, 12).map((seed) => (
          <div
            key={`star-${seed.id}`}
            style={{
              position: 'absolute',
              left: `${seed.seedY * 100}%`,
              top: `${seed.seedX * 90}%`,
              width: `${1.5 + seed.scale * 1.5}px`,
              height: `${1.5 + seed.scale * 1.5}px`,
              borderRadius: '50%',
              backgroundColor: 'var(--symbol-color-near)',
              opacity: 0.65,
            }}
          />
        ))}
      </div>

      {/* 부유 요소 렌더러 (Gliding & Color Morphing) */}
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: '80px',
            height: '80px',
            transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotate}deg)`,
            opacity: item.opacity,
            zIndex: item.isSymbol ? 5 : 2,
            transition:
              'left 1.1s cubic-bezier(0.76, 0, 0.24, 1), top 1.1s cubic-bezier(0.76, 0, 0.24, 1), transform 1.1s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.7s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.isSymbol ? (
            // 수학 기호
            <span
              style={{
                fontSize: '32px',
                fontWeight: '900',
                color: 'var(--symbol-color-near)',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                fontFamily: `'Outfit', -apple-system, sans-serif`,
                transition: 'color 0.8s ease-in-out',
                userSelect: 'none',
              }}
            >
              {item.symbol}
            </span>
          ) : (
            // 기하학 블록
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--rounded-md)',
                backgroundColor: 'var(--ground-color-mid)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background-color 0.8s ease-in-out',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
