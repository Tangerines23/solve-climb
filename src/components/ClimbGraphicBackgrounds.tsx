import { useMemo } from 'react';
import { World, Category } from '../types/quiz';
import { MAP_LAYOUT } from '../constants/stages';
import { SeededRandom } from '../utils/seededRandom';

interface BackgroundProps {
  world: World;
  category: Category;
  totalLevels?: number;
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

export function ClimbBackground({
  world,
  category,
  totalLevels: _totalLevels = 30,
}: BackgroundProps) {
  const { FIXED_MAX_LEVELS, NODE_SPACING, LIST_DISTANCE } = MAP_LAYOUT;
  const lastNodeY = LIST_DISTANCE;
  const firstNodeY = lastNodeY + (FIXED_MAX_LEVELS - 1) * NODE_SPACING;
  const svgHeight = firstNodeY + 100;

  // 6개의 물결(산 실루엣) 레이어 생성 (5레벨 간격 = 800px 마다 존재)
  const mountainLayers = useMemo(() => {
    const layers = [];
    // 먼 산(i=5)부터 가까운 산(i=0) 순서대로 겹쳐서 그림
    // 지도 높이에 비례하여 산의 baseY가 음수가 되거나 하늘을 완전히 덮지 않도록 자동 스케일링
    const startY = Math.max(100, firstNodeY * 0.15);
    const endY = firstNodeY;

    for (let i = 5; i >= 0; i--) {
      const baseY = startY + (endY - startY) * (1 - i / 5);

      const waveAmplitude = 30; // 물결 높이
      const waveDir = i % 2 === 0 ? 1 : -1; // 홀수/짝수 굴곡 방향 교차

      const d = `M 0,${svgHeight} 
                 L 0,${baseY} 
                 Q 100,${baseY - waveAmplitude * waveDir} 200,${baseY} 
                 T 400,${baseY} 
                 L 400,${svgHeight} 
                 Z`;

      let fillVar = 'var(--ground-color-near)';
      let baseOpacity = 0.88;

      if (i >= 4) {
        fillVar = 'var(--ground-color-far)';
        baseOpacity = 0.38 + (i - 4) * 0.1; // 0.38, 0.48
      } else if (i >= 2) {
        fillVar = 'var(--ground-color-mid)';
        baseOpacity = 0.55 + (i - 2) * 0.1; // 0.55, 0.65
      } else {
        fillVar = 'var(--ground-color-near)';
        baseOpacity = 0.78 + i * 0.1; // 0.78, 0.88
      }

      layers.push({
        id: `mountain-layer-${i}`,
        d,
        fill: fillVar,
        opacity: baseOpacity,
      });
    }
    return layers;
  }, [firstNodeY, svgHeight]);

  // 대수 카테고리 등호 다리 Y좌표 계산 (높이에 맞춰 800px 단위로 분산)
  const bridgeYCoords = useMemo(() => {
    const coords = [];
    for (let y = 800; y < svgHeight - 200; y += 800) {
      coords.push(y);
    }
    return coords;
  }, [svgHeight]);

  // 심화 카테고리 기하학 접선 라인 Y좌표 계산 (높이에 맞춰 1200px 단위로 분산)
  const tangentLines = useMemo(() => {
    const lines = [];
    for (let y = 800; y < svgHeight - 200; y += 1200) {
      lines.push({ y1: y, y2: y + 150 });
    }
    return lines;
  }, [svgHeight]);

  // 카테고리 및 월드별 수학적 대형(Layout) 좌표 계산 (일일 날짜 시드 캐싱 동시 적용)
  const items = useMemo(() => {
    // 1. 일일 날짜 시드값 키 생성 (매일 단위의 레이아웃 변경용)
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    // 단순한 문자열 해시 함수
    let dateHash = 0;
    for (let charIdx = 0; charIdx < todayStr.length; charIdx++) {
      dateHash = (dateHash << 5) - dateHash + todayStr.charCodeAt(charIdx);
      dateHash |= 0; // Convert to 32bit integer
    }
    const dailySeed = Math.abs(dateHash);

    const worldIdx = getWorldIndex(world);
    const catIdx = getCategoryIndex(category);

    // 날짜 시드 + 카테고리 + 월드 팩터를 활용해 고유 Seed 생성
    const combinedSeed = dailySeed + worldIdx * 123 + catIdx * 456;
    const rng = new SeededRandom(combinedSeed);

    // 2. 총 24개의 슬롯에 대해 정적 구역(6개) 및 기준 좌표 매핑
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

    // 3. 템플릿 패턴 선택 (Seed * Pattern)
    // 4가지 대표 오프셋 배치 패턴
    const PATTERNS = [
      { dx: 5, dy: 3 },    // 지그재그 분산
      { dx: -7, dy: 5 },   // 좌하단 치우침
      { dx: 6, dy: -4 },   // 우상단 치우침
      { dx: -4, dy: -6 }   // 중앙 밀집형
    ];
    // Seed 기반으로 패턴 무작위 픽
    const selectedPattern = PATTERNS[combinedSeed % PATTERNS.length];

    // 4. 활성화 번호 조합 선택 (Combination Pick)
    // 24개 인덱스 중 15개 ~ 21개를 시드에 맞추어 랜덤하게 선택
    const activeCount = rng.nextInt(15, 21);
    const activeIndices = new Set<number>();
    while (activeIndices.size < activeCount) {
      activeIndices.add(rng.nextInt(0, 23));
    }

    // 5. 기호와 원 비율 조율 (기호 비율 30% ~ 70% 범위 고정)
    const symbolRatio = 0.3 + rng.next() * 0.4;
    const symbolCount = Math.round(activeCount * symbolRatio);

    // 활성 인덱스 리스트 셔플하여 기호/도형 분배
    const activeArray = Array.from(activeIndices);
    const shuffledActive = [...activeArray].sort(() => rng.next() - 0.5);
    const symbolIndices = new Set(shuffledActive.slice(0, symbolCount));

    // 6. 각 슬롯 좌표 및 타입 결정
    return slots.map((slot) => {
      const isActive = activeIndices.has(slot.index);
      const isSymbol = symbolIndices.has(slot.index);

      let x = slot.baseX;
      let y = slot.baseY;
      const opacity = isActive ? (isSymbol ? 0.55 : 0.85) : 0;
      const scale = 0.6 + rng.next() * 0.45; // 0.6 ~ 1.05
      const rotate = rng.nextInt(0, 360);
      let symbol = '';

      if (isActive) {
        // [시드*패턴] 알고리즘을 이용해 기준 좌표에 고유 패턴 편차 dx, dy를 결합
        const patternX = selectedPattern.dx * (slot.index % 2 === 0 ? 1 : -1);
        const patternY = selectedPattern.dy * (slot.index % 3 === 0 ? 1 : -1);

        // 부드러운 위치 배치를 위해 시드기반 미세 진동 오프셋 추가
        const microOffsetX = (rng.next() - 0.5) * 6; // +-3%

        x = Math.max(5, Math.min(95, slot.baseX + patternX + microOffsetX));
        y = Math.max(5, Math.min(95, slot.baseY + patternY));
      } else {
        // 화면 밖으로 미끄러져 나감 (Slide Out) 및 투명화
        x = slot.baseX < 50 ? -25 : 125;
        y = slot.baseY + (rng.next() - 0.5) * 20;
      }

      // 카테고리별 수학 기호 대입
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
      {/* 6단 5레벨 주기 산 실루엣 & 카테고리별 특수 효과 레이어 SVG */}
      <svg
        viewBox={`0 0 400 ${svgHeight}`}
        className="mountain-background-svg"
        preserveAspectRatio="none"
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
          height={svgHeight}
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
          {bridgeYCoords.map((y, idx) => (
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
          {tangentLines.map((line, idx) => (
            <g key={`tangent-${idx}`}>
              <line
                x1="0"
                y1={line.y1}
                x2="400"
                y2={line.y2}
                stroke="var(--symbol-color-near)"
                strokeWidth="2"
                strokeDasharray="6,6"
              />
            </g>
          ))}
        </g>

        {/* 4. 6단 5레벨 주기 산 실루엣 물결 레이어 */}
        {mountainLayers.map((layer) => (
          <path
            key={layer.id}
            d={layer.d}
            fill={layer.fill}
            style={{
              opacity: layer.opacity,
              transition: 'fill 0.8s ease-in-out',
            }}
          />
        ))}
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
