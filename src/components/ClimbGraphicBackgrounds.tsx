import { useMemo } from 'react';
import { World, Category } from '../types/quiz';
import { MAP_LAYOUT } from '../constants/stages';
import { SeededRandom } from '../utils/seededRandom';

interface BackgroundProps {
  world: World;
  category: Category;
  totalLevels?: number;
}

// Helper functions
const getMountainLayerStyle = (layerIndex: number) => {
  if (layerIndex >= 4) {
    return { fill: 'var(--ground-color-far)', opacity: 0.38 + (layerIndex - 4) * 0.1 };
  }
  if (layerIndex >= 2) {
    return { fill: 'var(--ground-color-mid)', opacity: 0.55 + (layerIndex - 2) * 0.1 };
  }
  return { fill: 'var(--ground-color-near)', opacity: 0.78 + layerIndex * 0.1 };
};

const getCategorySymbol = (category: Category, slotIndex: number) => {
  const symbolsByCategory: Record<string, string[]> = {
    기초: ['+', '-', '×', '÷', '='],
    대수: ['x', 'y', 'a', 'b', 'z'],
    논리: ['>', '<', '1', '2', '3', '5', '8'],
    심화: ['∫', '∞', '∂', 'dx', 'dy'],
  };

  const symbols = symbolsByCategory[category];
  return symbols?.[slotIndex % symbols.length] || '';
};

const computeSlotCoordinates = (
  isActive: boolean,
  slot: { index: number; baseX: number; baseY: number },
  selectedPattern: { dx: number; dy: number },
  rng: SeededRandom
) => {
  if (isActive) {
    const patternX = selectedPattern.dx * (slot.index % 2 === 0 ? 1 : -1);
    const patternY = selectedPattern.dy * (slot.index % 3 === 0 ? 1 : -1);
    const microOffsetX = (rng.next() - 0.5) * 6;
    return {
      x: Math.max(5, Math.min(95, slot.baseX + patternX + microOffsetX)),
      y: Math.max(5, Math.min(95, slot.baseY + patternY)),
    };
  }
  return {
    x: slot.baseX < 50 ? -25 : 125,
    y: slot.baseY + (rng.next() - 0.5) * 20,
  };
};

const getWorldIndex = (world: World) => {
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

const getCategoryIndex = (category: Category) => {
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

const getOpacityForCategory = (category: Category, elementType: string) => {
  if (elementType === 'grid') {
    return category === '대수' || category === '심화' ? 0.6 : 0;
  }
  if (elementType === 'bridge') {
    return category === '대수' ? 0.75 : 0;
  }
  if (elementType === 'tangent') {
    return category === '심화' ? 0.45 : 0;
  }
  return category === '심화' ? 0.8 : 0;
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

  // Mountain layers
  const mountainLayers = useMemo(() => {
    const layers = [];
    const startY = Math.max(100, firstNodeY * 0.15);
    const endY = firstNodeY;

    for (let i = 5; i >= 0; i--) {
      const baseY = startY + (endY - startY) * (1 - i / 5);
      const waveAmplitude = 30;
      const waveDir = i % 2 === 0 ? 1 : -1;
      const d = `M 0,${svgHeight} L 0,${baseY} Q 100,${baseY - waveAmplitude * waveDir} 200,${baseY} T 400,${baseY} L 400,${svgHeight} Z`;
      const style = getMountainLayerStyle(i);
      layers.push({ id: `mountain-layer-${i}`, d, ...style });
    }
    return layers;
  }, [firstNodeY, svgHeight]);

  // Bridge coordinates
  const bridgeYCoords = useMemo(() => {
    const coords = [];
    for (let y = 800; y < svgHeight - 200; y += 800) {
      coords.push(y);
    }
    return coords;
  }, [svgHeight]);

  // Tangent lines
  const tangentLines = useMemo(() => {
    const lines = [];
    for (let y = 800; y < svgHeight - 200; y += 1200) {
      lines.push({ y1: y, y2: y + 150 });
    }
    return lines;
  }, [svgHeight]);

  // Floating seeds
  const FLOATING_SEEDS = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const sin1 = Math.sin(i + 1) * 10000;
      const seedX = sin1 - Math.floor(sin1);
      const sin2 = Math.sin(i + 2.5) * 10000;
      const seedY = sin2 - Math.floor(sin2);
      const scale = 0.5 + (sin1 * 0.5 - Math.floor(sin1 * 0.5));
      return { id: `float-${i}`, seedX, seedY, scale, index: i };
    });
  }, []);

  // Items
  const items = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let dateHash = 0;
    for (let charIdx = 0; charIdx < todayStr.length; charIdx++) {
      dateHash = (dateHash << 5) - dateHash + todayStr.charCodeAt(charIdx);
      dateHash |= 0;
    }
    const dailySeed = Math.abs(dateHash);
    const worldIdx = getWorldIndex(world);
    const catIdx = getCategoryIndex(category);
    const combinedSeed = dailySeed + worldIdx * 123 + catIdx * 456;
    const rng = new SeededRandom(combinedSeed);

    const slots = Array.from({ length: 24 }, (_, i) => {
      const zone = Math.floor(i / 4);
      const slotInZone = i % 4;
      const zoneHeight = 100 / 6;
      const yStart = zone * zoneHeight;
      const baseX = 15 + slotInZone * 23;
      const baseY =
        yStart + zoneHeight * 0.3 + (slotInZone % 2 === 0 ? zoneHeight * 0.1 : zoneHeight * 0.4);
      return { id: `float-node-${i}`, index: i, baseX, baseY };
    });

    const PATTERNS = [
      { dx: 5, dy: 3 },
      { dx: -7, dy: 5 },
      { dx: 6, dy: -4 },
      { dx: -4, dy: -6 },
    ];
    const selectedPattern = PATTERNS[combinedSeed % PATTERNS.length];
    const activeCount = rng.nextInt(15, 21);
    const activeIndices = new Set<number>();
    while (activeIndices.size < activeCount) {
      activeIndices.add(rng.nextInt(0, 23));
    }
    const symbolRatio = 0.3 + rng.next() * 0.4;
    const symbolCount = Math.round(activeCount * symbolRatio);
    const activeArray = Array.from(activeIndices);
    const shuffledActive = [...activeArray].sort(() => rng.next() - 0.5);
    const symbolIndices = new Set(shuffledActive.slice(0, symbolCount));

    return slots.map((slot) => {
      const isActive = activeIndices.has(slot.index);
      const isSymbol = symbolIndices.has(slot.index);
      const coordinates = computeSlotCoordinates(isActive, slot, selectedPattern, rng);
      const symbol = isSymbol ? getCategorySymbol(category, slot.index) : '';
      const opacity = isActive ? (isSymbol ? 0.55 : 0.85) : 0;
      const scale = 0.6 + rng.next() * 0.45;
      const rotate = rng.nextInt(0, 360);
      return { ...slot, ...coordinates, symbol, opacity, scale, rotate, isSymbol };
    });
  }, [world, category]);

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

        <rect
          width="400"
          height={svgHeight}
          fill="url(#climb-grid)"
          style={{ opacity: getOpacityForCategory(category, 'grid') }}
        />

        <g style={{ opacity: getOpacityForCategory(category, 'bridge') }}>
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

        <g style={{ opacity: getOpacityForCategory(category, 'tangent') }}>
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

        {mountainLayers.map((layer) => (
          <path key={layer.id} d={layer.d} fill={layer.fill} style={{ opacity: layer.opacity }} />
        ))}
      </svg>

      <div style={{ opacity: getOpacityForCategory(category, 'star') }}>
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
          }}
        >
          {item.isSymbol ? (
            <span
              style={{ fontSize: '32px', fontWeight: '900', color: 'var(--symbol-color-near)' }}
            >
              {item.symbol}
            </span>
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--rounded-md)',
                backgroundColor: 'var(--ground-color-mid)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
