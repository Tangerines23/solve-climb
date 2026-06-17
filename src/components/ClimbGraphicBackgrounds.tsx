import { useMemo } from 'react';
import { World, Category } from '../types/quiz';

interface BackgroundProps {
  world: World;
  category: Category;
  totalLevels?: number;
}

// Seeded Random Helper (결정론적 난수 생성기)
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const getCategoryIndex = (category: Category): number => {
  switch (category) {
    case '기초':
      return 1;
    case '대수':
      return 2;
    case '논리':
      return 3;
    case '심화':
      return 4;
    default:
      return 0;
  }
};

// 잔별(Star)들의 렌더링을 위한 고정 난수 값 리스트 (12개)
const FLOATING_SEEDS = Array.from({ length: 12 }, (_, i) => {
  const sin1 = Math.sin(i + 1) * 10000;
  const seedX = sin1 - Math.floor(sin1);
  const sin2 = Math.sin(i + 2.5) * 10000;
  const seedY = sin2 - Math.floor(sin2);
  const scale = 0.5 + (sin1 * 0.5 - Math.floor(sin1 * 0.5));

  return {
    id: `float-${i}`,
    seedX,
    seedY,
    scale,
    index: i,
  };
});

const getWorldIndex = (world: World): number => {
  switch (world) {
    case 'World1':
      return 1;
    case 'World2':
      return 2;
    case 'World3':
      return 3;
    case 'World4':
      return 4;
    case 'LangWorld1':
      return 5;
    default:
      return 0;
  }
};

export function ClimbBackground({ world, category }: BackgroundProps) {
  // 카테고리 및 월드별 수학적 대형(Layout) 좌표 계산
  const items = useMemo(() => {
    const worldIdx = getWorldIndex(world);
    const catIdx = getCategoryIndex(category);
    const rng = new SeededRandom(worldIdx * 17 + catIdx * 31);

    // 1. 총 24개의 슬롯에 대해 정적 구역(6개) 및 기준 좌표 매핑
    const slots = Array.from({ length: 24 }, (_, i) => {
      const zone = Math.floor(i / 4); // 6개 구역 (0 ~ 5)
      const slotInZone = i % 4;

      const zoneHeight = 100 / 6; // 약 16.6%
      const yStart = zone * zoneHeight;

      // 정적 기준 위치
      const baseX = 15 + slotInZone * 23; // 15%, 38%, 61%, 84% 부근에 분산
      const baseY =
        yStart + zoneHeight * 0.3 + (slotInZone % 2 === 0 ? zoneHeight * 0.1 : zoneHeight * 0.4);

      return {
        id: `float-node-${i}`,
        index: i,
        baseX,
        baseY,
      };
    });

    // 2. 활성/비활성 여부 결정 (총 개수를 15 ~ 21개 사이로 무작위 제한)
    const activeCount = rng.nextInt(15, 21);
    const activeIndices = new Set<number>();
    while (activeIndices.size < activeCount) {
      activeIndices.add(rng.nextInt(0, 23));
    }

    // 3. 기호와 원 비율 조율 (기호 비율 30% ~ 70% 범위 고정)
    const symbolRatio = 0.3 + rng.next() * 0.4;
    const symbolCount = Math.round(activeCount * symbolRatio);

    // 활성 인덱스 리스트 셔플하여 기호/도형 분배
    const activeArray = Array.from(activeIndices);
    const shuffledActive = [...activeArray].sort(() => rng.next() - 0.5);
    const symbolIndices = new Set(shuffledActive.slice(0, symbolCount));

    // 4. 각 슬롯 좌표 및 타입 결정
    return slots.map((slot) => {
      const isActive = activeIndices.has(slot.index);
      const isSymbol = symbolIndices.has(slot.index);

      let x = slot.baseX;
      let y = slot.baseY;
      let opacity = isActive ? (isSymbol ? 0.55 : 0.85) : 0;
      let scale = 0.6 + rng.next() * 0.45; // 0.6 ~ 1.05
      let rotate = rng.nextInt(0, 360);
      let symbol = '';

      if (isActive) {
        // 최대 이동 거리 제약: 기준 좌표로부터 X는 +-12%, Y는 +-8% 내에서만 움직임
        const offsetX = (rng.next() - 0.5) * 24; // 최대 12% 반경
        const offsetY = (rng.next() - 0.5) * 16; // 최대 8% 반경

        x = Math.max(5, Math.min(95, slot.baseX + offsetX));
        y = Math.max(5, Math.min(95, slot.baseY + offsetY));
      } else {
        // 화면 밖으로 미끄러져 나감 (Slide Out) 및 투명화
        x = slot.baseX < 50 ? -25 : 125; // 50% 기준 좌측/우측 화면 밖으로 튕김
        y = slot.baseY + (rng.next() - 0.5) * 20;
      }

      // 카테고리별 수학 기호 텍입
      if (isSymbol) {
        let symbols: string[] = [];
        if (category === '기초') symbols = ['+', '-', '×', '÷', '='];
        else if (category === '대수') symbols = ['x', 'y', 'a', 'b', 'z'];
        else if (category === '논리') symbols = ['>', '<', '1', '2', '3', '5', '8'];
        else if (category === '심화') symbols = ['∫', '∞', '∂', 'dx', 'dy'];

        symbol = symbols[slot.index % (symbols.length || 1)] || '';
      }

      return {
        id: slot.id,
        index: slot.index,
        x,
        y,
        scale,
        rotate,
        opacity,
        isSymbol,
        symbol,
      };
    });
  }, [world, category]);

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
