import { useMemo } from 'react';

interface StageBackgroundConfig {
  skyGradient: string;
  mainColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface BackgroundProps {
  config?: StageBackgroundConfig;
  categoryColor?: string;
  totalLevels?: number;
}

// ==========================================
// 1. 모양 컴포넌트 정의 (블록 & 기호)
// ==========================================

// [수정] 네모 블록 모양 (기호 제거됨)
const BlockShape = ({ type }: { type: 'near' | 'mid' | 'far' }) => {
  const fill = `var(--ground-color-${type})`;
  const opacity = `var(--ground-opacity-${type})`;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <rect x="0" y="0" width="100" height="100" rx="12" fill={fill} fillOpacity={opacity} />
    </svg>
  );
};

// [신규] 떠다니는 기호 모양
const SymbolShape = ({ symbol, type }: { symbol: string; type: 'near' | 'mid' | 'far' }) => {
  const color = `var(--symbol-color-${type})`;
  const opacity = `var(--symbol-opacity-${type})`;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="symbol-shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.2)" />
        </filter>
      </defs>
      <text
        x="50"
        y="55"
        fontSize="60"
        fill={color}
        fillOpacity={opacity}
        fontWeight="900"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ userSelect: 'none', filter: 'url(#symbol-shadow)' }}
      >
        {symbol}
      </text>
    </svg>
  );
};

// ==========================================
// 2. 유틸리티 및 로직 함수
// ==========================================

// [유틸리티] 배열 섞기 (유지)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// [로직] 높이별 타입 결정 (유지)
const getMountainType = (yPercent: number): 'near' | 'mid' | 'far' => {
  const rand = Math.random();
  if (yPercent < 40) return rand < 0.6 ? 'far' : 'mid';
  if (yPercent < 70) return rand < 0.3 ? 'far' : 'mid';
  if (yPercent < 85) {
    if (rand < 0.1) return 'far';
    if (rand < 0.7) return 'mid';
    return 'near';
  }
  return rand < 0.3 ? 'mid' : 'near';
};

// ==========================================
// 3. 메인 배경 컴포넌트 (ArithmeticBackground)
// ==========================================

export function ArithmeticBackground({ totalLevels = 15 }: BackgroundProps) {
  const items = useMemo(() => {
    // 사칙연산 기호 목록
    const symbols = ['+', '-', '×', '÷'];
    const generatedItems = [];

    const density = 1.8; // 블록 밀도
    const totalCount = Math.floor(totalLevels * density);
    const cols = 3;
    const rows = Math.ceil(totalCount / cols);

    let idCounter = 0;

    // --- 1단계: 블록(Block) 생성 (기존 로직) ---
    for (let r = 0; r < rows; r++) {
      const colIndices = shuffleArray(Array.from({ length: cols }, (_, i) => i));
      for (const c of colIndices) {
        if (idCounter >= totalCount) break;

        const rowHeight = 100 / rows;
        const yBase = r * rowHeight;
        const yJitter = Math.random() * rowHeight * 0.8;
        const y = yBase + yJitter;

        const colWidth = 100 / cols;
        const xMin = c * colWidth;
        const x = xMin + 10 + Math.random() * (colWidth - 20);

        const safeY = Math.max(0, Math.min(100, y));
        const type = getMountainType(safeY);

        let scale = 1;
        if (type === 'far') scale = 0.4 + Math.random() * 0.3;
        else if (type === 'mid') scale = 0.6 + Math.random() * 0.3;
        else if (type === 'near') scale = 0.8 + Math.random() * 0.4;

        // 블록 아이템 추가 (isSymbol: false, rotation 없음)
        generatedItems.push({
          id: `block-${idCounter++}`,
          x,
          y: safeY,
          type,
          scale,
          rotation: 0, // 블록은 회전 없음
          isSymbol: false, // 블록임
          symbol: null,
        });
      }
    }

    // --- 2단계: 기호(Symbol) 생성 (신규 로직) ---
    // 블록 개수의 약 50%만큼 기호를 추가로 생성하여 떠다니게 함
    const symbolCount = Math.floor(totalCount * 0.5);
    for (let i = 0; i < symbolCount; i++) {
      const y = Math.random() * 100; // 전체 영역에 랜덤 배치
      const x = Math.random() * 100;
      const type = getMountainType(y); // 높이에 따른 타입(크기/흐림) 결정
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]; // 랜덤 기호 선택

      let scale = 1;
      // 기호는 블록보다 약간 더 작게 설정
      if (type === 'far') scale = 0.3 + Math.random() * 0.2;
      else if (type === 'mid') scale = 0.5 + Math.random() * 0.2;
      else if (type === 'near') scale = 0.7 + Math.random() * 0.3;

      // 기호 아이템 추가 (isSymbol: true, rotation 없음)
      generatedItems.push({
        id: `symbol-${idCounter++}`,
        x,
        y,
        type,
        scale,
        rotation: 0, // 기호도 회전 없음
        isSymbol: true, // 기호임
        symbol: symbol,
      });
    }

    // Y축 정렬 (멀리 있는 것이 뒤로 가도록)
    return generatedItems.sort((a, b) => a.y - b.y);
  }, [totalLevels]);

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: '100px',
            height: '100px',
            // 회전 및 크기 적용 (블록과 기호 모두 회전 없음)
            transform: `translate(-50%, -50%) scale(${item.scale})`,
            // 타입에 따른 Z-index 및 블러 효과
            // 블록: 1, 2, 3 / 기호: 4, 5, 6 (블록보다 위, 노드(11)보다 아래)
            zIndex: item.isSymbol
              ? item.type === 'near'
                ? 6
                : item.type === 'mid'
                  ? 5
                  : 4
              : item.type === 'near'
                ? 3
                : item.type === 'mid'
                  ? 2
                  : 1,
            filter: item.type === 'far' ? 'blur(2px)' : item.type === 'mid' ? 'blur(1px)' : 'none',
            opacity: item.type === 'far' ? 0.8 : 1,
            transition: 'transform 0.5s ease-out',
          }}
        >
          {/* 아이템 타입에 따라 다른 컴포넌트 렌더링 */}
          {item.isSymbol ? (
            <SymbolShape symbol={item.symbol!} type={item.type} />
          ) : (
            <BlockShape type={item.type} />
          )}
        </div>
      ))}
    </div>
  );
}

// 2단계: 방정식 - 쌍둥이 대칭 협곡 (Symmetrical Twin Canyon)
export function EquationsBackground({ config, totalLevels = 15 }: BackgroundProps) {
  // 청록색 팔레트: Cyan-900 ~ Cyan-600
  const defaultConfig: StageBackgroundConfig = {
    skyGradient:
      'linear-gradient(180deg, #064E3B 0%, #065F46 20%, #047857 40%, #059669 60%, #10B981 80%, #5EEAD4 100%)',
    mainColor: '#064E3B', // Cyan-900 (아주 어두운 청록)
    secondaryColor: '#0891B2', // Cyan-600 (중간 청록)
    accentColor: '#22D3EE', // Cyan-400 (밝은 청록)
  };
  const finalConfig = config || defaultConfig;

  // 연결 다리(= 등호) 위치 계산: 짝수 번째 블록마다 배치
  // 경로 높이 계산 방식: 마지막 노드 Y = 100, 첫 노드 Y = 100 + (totalLevels - 1) * 80
  const bridgeYPositions: number[] = [];
  const LIST_DISTANCE = 100; // 경로 상단 오프셋
  const NODE_SPACING = 80; // 노드 간 간격
  const lastNodeY = LIST_DISTANCE;
  const firstNodeY = lastNodeY + (totalLevels - 1) * NODE_SPACING;

  const totalBridges = Math.ceil(totalLevels / 2);
  for (let i = 0; i < totalBridges; i++) {
    const blockIndex = (i + 1) * 2; // 2, 4, 6, 8...
    if (blockIndex <= totalLevels) {
      // 경로 높이를 기반으로 Y 위치 계산
      const progress = (blockIndex - 1) / (totalLevels - 1 || 1);
      const yPosition = firstNodeY - (firstNodeY - lastNodeY) * progress;
      bridgeYPositions.push(yPosition);
    }
  }

  // 부유하는 미지수 변수 생성 - 좌우 절벽 근처에 배치 (중앙은 비움)
  const variables = useMemo(() => {
    const vars: Array<{ id: string; x: number; y: number; symbol: string; delay: number }> = [];
    const symbols = ['x', 'y', 'a', 'b'];

    // 총 12개 정도의 미지수 생성
    for (let i = 0; i < 12; i++) {
      // X 위치: 좌측 0-35% 또는 우측 65-100% (중앙 35-65% 제외)
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const x =
        side === 'left'
          ? Math.random() * 35 // 좌측
          : 65 + Math.random() * 35; // 우측

      vars.push({
        id: `var-${i}`,
        x,
        y: Math.random() * 100, // 0-100% 상하 위치
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        delay: Math.random() * 3, // 애니메이션 지연 시간
      });
    }
    return vars;
  }, []);

  return (
    <div
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
      {/* 모눈종이(Grid) 패턴 배경 */}
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
          opacity: 0.15,
        }}
      >
        <defs>
          <pattern
            id="equation-grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={finalConfig.accentColor}
              strokeWidth="1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width="400" height="1200" fill="url(#equation-grid)" />
      </svg>

      {/* 메인 SVG: 협곡과 다리 */}
      <svg
        viewBox="0 -300 400 1200"
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
        {/* 왼쪽 절벽 (Far Layer - 먼 배경) - 중앙(200px)까지 닿지 않음 */}
        <g opacity="0.4">
          <polygon
            points="0,1200 0,-300 130,-300 140,-250 130,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-far"
          />
          <polygon
            points="20,1200 20,0 110,0 120,50 110,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-far"
          />
          <polygon
            points="50,1200 50,200 100,200 110,250 100,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-far"
          />
        </g>

        {/* 왼쪽 절벽 (Mid Layer - 중간 배경) */}
        <g opacity="0.6">
          <polygon
            points="0,1200 0,-200 120,-200 130,-150 120,1200"
            fill={finalConfig.secondaryColor}
            className="mountain-bg-mid"
          />
          <polygon
            points="30,1200 30,100 100,100 110,150 100,1200"
            fill={finalConfig.secondaryColor}
            className="mountain-bg-mid"
          />
          <polygon
            points="60,1200 60,300 90,300 100,350 90,1200"
            fill={finalConfig.secondaryColor}
            className="mountain-bg-mid"
          />
        </g>

        {/* 왼쪽 절벽 (Near Layer - 가까운 배경) - 최대 150px까지만 */}
        <g opacity="0.8">
          <polygon
            points="0,1200 0,-100 110,-100 140,-50 140,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-near"
          />
          <polygon
            points="40,1200 40,150 100,150 120,200 120,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-near"
          />
          <polygon
            points="70,1200 70,400 90,400 110,450 110,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-near"
          />
        </g>

        {/* 오른쪽 절벽 (왼쪽 절벽을 거울처럼 반전) - Far Layer */}
        <g opacity="0.4" transform="translate(400, 0) scale(-1, 1)">
          <polygon
            points="0,1200 0,-300 130,-300 140,-250 130,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-far"
          />
          <polygon
            points="20,1200 20,0 110,0 120,50 110,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-far"
          />
          <polygon
            points="50,1200 50,200 100,200 110,250 100,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-far"
          />
        </g>

        {/* 오른쪽 절벽 - Mid Layer */}
        <g opacity="0.6" transform="translate(400, 0) scale(-1, 1)">
          <polygon
            points="0,1200 0,-200 120,-200 130,-150 120,1200"
            fill={finalConfig.secondaryColor}
            className="mountain-bg-mid"
          />
          <polygon
            points="30,1200 30,100 100,100 110,150 100,1200"
            fill={finalConfig.secondaryColor}
            className="mountain-bg-mid"
          />
          <polygon
            points="60,1200 60,300 90,300 100,350 90,1200"
            fill={finalConfig.secondaryColor}
            className="mountain-bg-mid"
          />
        </g>

        {/* 오른쪽 절벽 - Near Layer */}
        <g opacity="0.8" transform="translate(400, 0) scale(-1, 1)">
          <polygon
            points="0,1200 0,-100 110,-100 140,-50 140,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-near"
          />
          <polygon
            points="40,1200 40,150 100,150 120,200 120,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-near"
          />
          <polygon
            points="70,1200 70,400 90,400 110,450 110,1200"
            fill={finalConfig.mainColor}
            className="mountain-bg-near"
          />
        </g>

        {/* 연결 다리 (= 등호) - 짝수 번째 블록마다, 중앙 공간(150-250px) 사이 */}
        {bridgeYPositions.map((yPos, index) => {
          const bridgeY = yPos;
          const bridgeThickness = 6;

          return (
            <g key={`bridge-${index}`} opacity="0.7">
              {/* 왼쪽 가로선 (150px 지점) */}
              <line
                x1={140}
                y1={bridgeY}
                x2={160}
                y2={bridgeY}
                stroke={finalConfig.accentColor}
                strokeWidth={bridgeThickness}
                strokeLinecap="round"
              />
              {/* 오른쪽 가로선 (250px 지점) */}
              <line
                x1={240}
                y1={bridgeY}
                x2={260}
                y2={bridgeY}
                stroke={finalConfig.accentColor}
                strokeWidth={bridgeThickness}
                strokeLinecap="round"
              />
              {/* 중앙 연결선 (옵션: 더 명확한 등호 표시) */}
              <line
                x1={160}
                y1={bridgeY}
                x2={240}
                y2={bridgeY}
                stroke={finalConfig.accentColor}
                strokeWidth={bridgeThickness * 0.4}
                strokeDasharray="5,5"
                opacity="0.4"
              />
            </g>
          );
        })}
      </svg>

      {/* 부유하는 미지수 변수 */}
      {variables.map((variable) => (
        <div
          key={variable.id}
          style={{
            position: 'absolute',
            left: `${variable.x}%`,
            top: `${variable.y}%`,
            fontSize: '28px',
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: finalConfig.accentColor,
            opacity: 0.6,
            pointerEvents: 'none',
            animation: `variableFloat 3s ease-in-out infinite`,
            animationDelay: `${variable.delay}s`,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {variable.symbol}
        </div>
      ))}
    </div>
  );
}

// 3단계: 수열 - 계단식/프랙탈 구조
export function SequenceBackground({ config }: BackgroundProps) {
  const defaultConfig: StageBackgroundConfig = {
    skyGradient: 'linear-gradient(180deg, #4B0082 0%, #6A5ACD 30%, #9370DB 60%, #BA55D3 100%)',
    mainColor: '#4B0082',
    secondaryColor: '#6A5ACD',
    accentColor: '#9370DB',
  };
  const finalConfig = config || defaultConfig;

  return (
    <svg
      viewBox="0 -300 800 1500"
      className="mountain-background-svg"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {/* 프랙탈 구조: 큰 삼각형 안에 작은 삼각형들 */}
      {/* 큰 삼각형 - 전체 배경의 70% (y: -300 ~ 750) */}
      <polygon
        points="100,1200 400,-250 700,1200"
        fill={finalConfig.mainColor}
        opacity="0.3"
        className="mountain-bg-far"
      />
      <polygon
        points="100,1200 400,0 700,1200"
        fill={finalConfig.mainColor}
        opacity="0.3"
        className="mountain-bg-far"
      />
      <polygon
        points="150,750 400,200 650,750"
        fill={finalConfig.mainColor}
        opacity="0.25"
        className="mountain-bg-far"
      />

      {/* 중간 삼각형들 - 전체 배경의 50% (y: 300 ~ 1050) */}
      <polygon
        points="200,1200 400,400 600,1200"
        fill={finalConfig.secondaryColor}
        opacity="0.4"
        className="mountain-bg-mid"
      />
      <polygon
        points="150,1200 275,550 400,1200"
        fill={finalConfig.secondaryColor}
        opacity="0.4"
        className="mountain-bg-mid"
      />
      <polygon
        points="400,1200 525,550 650,1200"
        fill={finalConfig.secondaryColor}
        opacity="0.4"
        className="mountain-bg-mid"
      />
      <polygon
        points="100,1050 300,650 500,1050"
        fill={finalConfig.secondaryColor}
        opacity="0.35"
        className="mountain-bg-mid"
      />

      {/* 계단식 구조 - 전체 배경의 30% (y: 750 ~ 1200) */}
      <polygon
        points="0,1200 0,1100 60,1100 60,1050 120,1050 120,1000 180,1000 180,950 240,950 240,900 300,900 300,1200"
        fill={finalConfig.mainColor}
        opacity="0.6"
        className="mountain-bg-near"
      />
      <polygon
        points="0,1200 0,1150 80,1150 80,1100 160,1100 160,1050 240,1050 240,1020 320,1020 320,1000 400,1000 400,1200"
        fill={finalConfig.mainColor}
        opacity="0.7"
        className="mountain-bg-near"
      />
      <polygon
        points="400,1200 400,1000 480,1000 480,1020 560,1020 560,1050 640,1050 640,1100 720,1100 720,1150 800,1150 800,1200"
        fill={finalConfig.mainColor}
        opacity="0.7"
        className="mountain-bg-near"
      />
      <polygon
        points="500,1200 500,900 560,900 560,950 620,950 620,1000 680,1000 680,1050 740,1050 740,1100 800,1100 800,1200"
        fill={finalConfig.mainColor}
        opacity="0.6"
        className="mountain-bg-near"
      />

      {/* 규칙적으로 배치된 바위들 - 화면 전체에 분산 */}
      <circle cx="100" cy="-150" r="10" fill={finalConfig.accentColor} opacity="0.4" />
      <circle cx="300" cy="-130" r="12" fill={finalConfig.accentColor} opacity="0.4" />
      <circle cx="500" cy="-140" r="10" fill={finalConfig.accentColor} opacity="0.4" />
      <circle cx="700" cy="-120" r="12" fill={finalConfig.accentColor} opacity="0.4" />
      <circle cx="150" cy="50" r="14" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="350" cy="40" r="16" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="550" cy="60" r="14" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="150" cy="680" r="15" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="250" cy="670" r="12" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="350" cy="660" r="18" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="450" cy="660" r="18" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="550" cy="670" r="12" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="650" cy="680" r="15" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="200" cy="1000" r="14" fill={finalConfig.accentColor} opacity="0.5" />
      <circle cx="600" cy="1020" r="16" fill={finalConfig.accentColor} opacity="0.5" />
    </svg>
  );
}

// 4단계: 미적분 - 곡선형 부유섬
export function CalculusBackground({ config }: BackgroundProps) {
  const defaultConfig: StageBackgroundConfig = {
    skyGradient: 'linear-gradient(180deg, #000428 0%, #004e92 30%, #1a1a2e 60%, #16213e 100%)',
    mainColor: '#000428',
    secondaryColor: '#004e92',
    accentColor: '#00D4FF',
  };
  const finalConfig = config || defaultConfig;

  return (
    <svg
      viewBox="0 -300 800 1500"
      className="mountain-background-svg"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {/* 배경 그리드 패턴 - viewBox 전체에 맞게 조정 */}
      <defs>
        <pattern
          id="grid"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          opacity="0.2"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={finalConfig.accentColor}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect x="0" y="-300" width="800" height="1800" fill="url(#grid)" />

      {/* 좌표축 - viewBox 내부에 맞게 조정 */}
      <line
        x1="0"
        y1="600"
        x2="800"
        y2="600"
        stroke={finalConfig.accentColor}
        strokeWidth="2"
        opacity="0.3"
      />
      <line
        x1="400"
        y1="-300"
        x2="400"
        y2="1200"
        stroke={finalConfig.accentColor}
        strokeWidth="2"
        opacity="0.3"
      />

      {/* 부유섬 1 - 곡선형 (좌우로 분산) - 전체 배경의 70% (y: -300 ~ 750) */}
      <path
        d="M 50,-250 Q 200,-300 300,-250 T 500,-270 T 650,-250 Z"
        fill={finalConfig.mainColor}
        opacity="0.3"
        className="mountain-bg-far"
      />
      <path
        d="M 0,-150 Q 100,-200 200,-170 T 400,-180 T 600,-150 Z"
        fill={finalConfig.mainColor}
        opacity="0.35"
        className="mountain-bg-far"
      />
      <path
        d="M 150,0 Q 250,-50 350,-20 T 550,-30 T 700,0 Z"
        fill={finalConfig.mainColor}
        opacity="0.4"
        className="mountain-bg-far"
      />
      <path
        d="M 100,200 Q 200,50 300,100 T 500,80 T 600,200 Z"
        fill={finalConfig.mainColor}
        opacity="0.4"
        className="mountain-bg-far"
      />
      <path
        d="M 50,500 Q 200,350 350,400 T 550,380 T 700,500 Z"
        fill={finalConfig.mainColor}
        opacity="0.35"
        className="mountain-bg-far"
      />

      {/* 부유섬 2 - 중간 높이 (좌우로 분산) - 전체 배경의 50% (y: 300 ~ 1050) */}
      <path
        d="M 0,100 Q 150,0 300,20 T 500,0 T 700,100 Z"
        fill={finalConfig.secondaryColor}
        opacity="0.4"
        className="mountain-bg-mid"
      />
      <path
        d="M 100,150 Q 250,50 400,70 T 600,60 T 750,150 Z"
        fill={finalConfig.secondaryColor}
        opacity="0.45"
        className="mountain-bg-mid"
      />
      <path
        d="M 0,300 Q 150,100 300,120 T 500,100 T 700,300 Z"
        fill={finalConfig.secondaryColor}
        opacity="0.5"
        className="mountain-bg-mid"
      />
      <path
        d="M 150,650 Q 300,550 450,570 T 650,560 T 800,650 Z"
        fill={finalConfig.secondaryColor}
        opacity="0.45"
        className="mountain-bg-mid"
      />

      {/* 부유섬 3 - 적분 면적 형태 (좌우로 분산) - 전체 배경의 30% (y: 750 ~ 1200) */}
      <path
        d="M 50,1200 L 50,1000 Q 200,950 350,980 T 550,960 T 750,1200 Z"
        fill={finalConfig.mainColor}
        opacity="0.7"
        className="mountain-bg-near"
      />
      <path
        d="M 200,1180 L 200,1120 Q 350,1080 450,1100 T 600,1090 T 700,1180 Z"
        fill={finalConfig.mainColor}
        opacity="0.65"
        className="mountain-bg-near"
      />
      <path
        d="M 100,1200 L 100,1050 Q 250,1000 400,1030 T 600,1010 T 800,1200 Z"
        fill={finalConfig.mainColor}
        opacity="0.7"
        className="mountain-bg-near"
      />

      {/* 접선 빛줄기 - 화면 전체에 분산 */}
      <line
        x1="0"
        y1="-250"
        x2="800"
        y2="-200"
        stroke={finalConfig.accentColor}
        strokeWidth="2"
        opacity="0.3"
        strokeDasharray="5,5"
      />
      <line
        x1="0"
        y1="150"
        x2="800"
        y2="200"
        stroke={finalConfig.accentColor}
        strokeWidth="2"
        opacity="0.4"
        strokeDasharray="5,5"
      />
      <line
        x1="100"
        y1="100"
        x2="700"
        y2="250"
        stroke={finalConfig.accentColor}
        strokeWidth="2"
        opacity="0.3"
        strokeDasharray="5,5"
      />
      <line
        x1="0"
        y1="850"
        x2="800"
        y2="900"
        stroke={finalConfig.accentColor}
        strokeWidth="2"
        opacity="0.3"
        strokeDasharray="5,5"
      />

      {/* 적분 기호 - 화면 전체에 분산 */}
      <text
        x="100"
        y="-230"
        fontSize="45"
        fill={finalConfig.accentColor}
        opacity="0.5"
        className="math-symbol"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∫
      </text>
      <text
        x="700"
        y="-220"
        fontSize="38"
        fill={finalConfig.accentColor}
        opacity="0.4"
        className="math-symbol"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∞
      </text>
      <text
        x="200"
        y="250"
        fontSize="50"
        fill={finalConfig.accentColor}
        opacity="0.6"
        className="math-symbol"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∫
      </text>
      <text
        x="600"
        y="220"
        fontSize="40"
        fill={finalConfig.accentColor}
        opacity="0.5"
        className="math-symbol"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∞
      </text>
      <text
        x="500"
        y="980"
        fontSize="42"
        fill={finalConfig.accentColor}
        opacity="0.5"
        className="math-symbol"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∫
      </text>
      <text
        x="300"
        y="1100"
        fontSize="40"
        fill={finalConfig.accentColor}
        opacity="0.5"
        className="math-symbol"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∞
      </text>

      {/* 별들 - 화면 전체에 분산 */}
      <circle cx="150" cy="-270" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="300" cy="-250" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="500" cy="-260" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="650" cy="-240" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="750" cy="-280" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="150" cy="50" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="300" cy="80" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="500" cy="60" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="650" cy="90" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="750" cy="40" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="200" cy="30" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="450" cy="45" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="680" cy="25" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="100" cy="1050" r="2" fill={finalConfig.accentColor} opacity="0.8" />
      <circle cx="400" cy="1080" r="1.5" fill={finalConfig.accentColor} opacity="0.7" />
      <circle cx="700" cy="1100" r="2" fill={finalConfig.accentColor} opacity="0.8" />
    </svg>
  );
}

// 기본 배경 (다른 카테고리용)
export function DefaultBackground({ categoryColor }: { categoryColor?: string }) {
  return (
    <svg
      viewBox="0 -300 800 1500"
      className="mountain-background-svg"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {/* 먼 산 - 전체 배경의 70% (y: -300 ~ 750) */}
      <polygon
        points="100,1200 400,-250 700,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.3"
        className="mountain-bg-far"
      />
      <polygon
        points="100,1200 400,0 700,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.3"
        className="mountain-bg-far"
      />

      {/* 중간 산 - 전체 배경의 50% (y: 300 ~ 1050) */}
      <polygon
        points="-40,1200 160,350 360,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.5"
        className="mountain-bg-mid"
      />
      <polygon
        points="440,1200 640,400 840,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.5"
        className="mountain-bg-mid"
      />
      <polygon
        points="50,1050 250,650 450,1050"
        fill={categoryColor || '#00BFA5'}
        opacity="0.4"
        className="mountain-bg-mid"
      />

      {/* 가까운 산 - 전체 배경의 30% (y: 750 ~ 1200) */}
      <polygon
        points="0,1200 120,920 240,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.8"
        className="mountain-bg-near"
      />
      <polygon
        points="0,1200 400,980 800,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.8"
        className="mountain-bg-near"
      />
      <polygon
        points="560,1200 680,920 800,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.8"
        className="mountain-bg-near"
      />
      <polygon
        points="200,1200 400,1050 600,1200"
        fill={categoryColor || '#00BFA5'}
        opacity="0.7"
        className="mountain-bg-near"
      />
    </svg>
  );
}

// 배경 컴포넌트 선택 함수
// eslint-disable-next-line react-refresh/only-export-components
export function getBackgroundComponent(subTopic: string) {
  switch (subTopic) {
    case 'arithmetic':
      return ArithmeticBackground;
    case 'equations':
      return EquationsBackground;
    case 'sequence':
      return SequenceBackground;
    case 'calculus':
      return CalculusBackground;
    default:
      return DefaultBackground;
  }
}
