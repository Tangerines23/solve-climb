import React, { useState, useEffect, useMemo } from 'react';
import './GeometryTipVisualizer.css';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 52;

interface ShapeConfig {
  sides: number;
  name: string;
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  { sides: 3, name: '삼각형' },
  { sides: 4, name: '사각형' },
  { sides: 5, name: '오각형' },
  { sides: 6, name: '육각형' },
];

// Pre-calculate fixed regular polygon vertices for 3, 4, 5, 6 sides (Zero GC overhead)
const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  3: computeRegularVertices(3),
  4: computeRegularVertices(4),
  5: computeRegularVertices(5),
  6: computeRegularVertices(6),
};

function computeRegularVertices(n: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push({
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    });
  }
  return pts;
}

export const ManimLevel1Visualizer: React.FC = () => {
  const [shapeIdx, setShapeIdx] = useState(0);
  const [prevSides, setPrevSides] = useState(3);
  const [currSides, setCurrSides] = useState(3);
  const [progress, setProgress] = useState(1);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  // 1. Smooth rAF Eased Progress Animation (1.2s cubic easeInOut)
  useEffect(() => {
    if (prevSides === currSides) return;
    setProgress(0);
    setHighlightIdx(null);

    let start: number | null = null;
    let animId: number;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const rawT = Math.min(elapsed / duration, 1);

      // easeInOutCubic curve
      const eased =
        rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

      setProgress(eased);

      if (rawT < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [currSides, prevSides]);

  // 2. Dynamic Shape Cycle Controller: Wait exactly 0.5s after highlight ends before next shape transition
  useEffect(() => {
    if (progress < 1) return;

    let step = 0;
    setHighlightIdx(0);

    // Step-by-step clockwise dot highlight (650ms per dot)
    const highlightTimer = setInterval(() => {
      step++;
      if (step < currSides) {
        setHighlightIdx(step);
      } else {
        // Highlight complete for all dots! Turn off highlight.
        setHighlightIdx(null);
        clearInterval(highlightTimer);

        // Wait EXACTLY 0.5s after highlight is turned off, then trigger next shape!
        setTimeout(() => {
          setShapeIdx((idx) => {
            const nextIdx = (idx + 1) % SHAPE_CONFIGS.length;
            setPrevSides(SHAPE_CONFIGS[idx]!.sides);
            setCurrSides(SHAPE_CONFIGS[nextIdx]!.sides);
            return nextIdx;
          });
        }, 500);
      }
    }, 650);

    return () => clearInterval(highlightTimer);
  }, [progress, currSides]);

  // Memoized Morph Points computation (Zero unnecessary object allocations)
  const morphPts = useMemo(() => {
    const targetBase = PRECOMPUTED_VERTICES[currSides] || PRECOMPUTED_VERTICES[3]!;
    if (progress >= 1 || prevSides === currSides) {
      return targetBase;
    }

    if (currSides > prevSides) {
      // EXPAND / SPREAD (3 -> 4, 4 -> 5, 5 -> 6)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const initialPoints: { x: number; y: number }[] = [];

      let splitVertexIdx = 1;
      if (prevSides === 3) splitVertexIdx = 1;
      if (prevSides === 4) splitVertexIdx = 2;
      if (prevSides === 5) splitVertexIdx = 2;

      const cornerPt = startBase[splitVertexIdx % prevSides]!;

      for (let i = 0; i < currSides; i++) {
        if (i <= splitVertexIdx) {
          initialPoints.push(startBase[i]!);
        } else if (i === splitVertexIdx + 1) {
          initialPoints.push(cornerPt);
        } else {
          initialPoints.push(startBase[i - 1]!);
        }
      }

      return targetBase.map((target, i) => {
        const start = initialPoints[i]!;
        return {
          x: start.x + (target.x - start.x) * progress,
          y: start.y + (target.y - start.y) * progress,
        };
      });
    } else {
      // SHRINK / MERGE (6 -> 3)
      const startBase = PRECOMPUTED_VERTICES[prevSides]!;
      const targetTriangle = PRECOMPUTED_VERTICES[currSides]!;

      const targetMap = [
        targetTriangle[0]!,
        targetTriangle[1]!,
        targetTriangle[1]!,
        targetTriangle[2]!,
        targetTriangle[2]!,
        targetTriangle[2]!,
      ];

      return startBase.map((start, i) => {
        const target = targetMap[i] || targetTriangle[2]!;
        return {
          x: start.x + (target.x - start.x) * progress,
          y: start.y + (target.y - start.y) * progress,
        };
      });
    }
  }, [currSides, prevSides, progress]);

  const currentConfig = SHAPE_CONFIGS[shapeIdx] || SHAPE_CONFIGS[0]!;
  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  return (
    <div className="geo-level1-wrapper">
      <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
        {/* Main Morphing Polygon */}
        <polygon points={ptsStr} className="geo-shape-poly-morph" />

        {/* Edge Lines */}
        {morphPts.map((p, idx) => {
          const nextP = morphPts[(idx + 1) % morphPts.length]!;
          return (
            <line
              key={`edge-${idx}`}
              x1={p.x}
              y1={p.y}
              x2={nextP.x}
              y2={nextP.y}
              className="geo-edge-animated-line"
            />
          );
        })}

        {/* Simple Vertex Dots with radius scaling */}
        {morphPts.map((p, idx) => {
          const isHighlighted = highlightIdx === idx;
          return (
            <circle
              key={`dot-${idx}`}
              cx={p.x}
              cy={p.y}
              r={isHighlighted ? '8.5' : '5'}
              className={`geo-simple-dot ${isHighlighted ? 'active-dot' : ''}`}
            />
          );
        })}

        {/* Static Labels */}
        {morphPts.length > 0 && (
          <g className="geo-label-pointer">
            <text x={morphPts[0]!.x} y={morphPts[0]!.y - 14} className="geo-pointer-tag vertex-tag">
              ● 꼭짓점(점)
            </text>
            {morphPts.length >= 2 && (
              <text
                x={(morphPts[0]!.x + morphPts[1]!.x) / 2 + 18}
                y={(morphPts[0]!.y + morphPts[1]!.y) / 2}
                className="geo-pointer-tag edge-tag"
              >
                ━ 변(선)
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Bottom Static Caption Box */}
      <div className="geo-level1-caption-box">
        <span className="geo-shape-badge">{currentConfig.name}</span>
        <div className="geo-stat-highlights">
          <span className={`geo-stat-item vertex-highlight ${highlightIdx !== null ? 'active-glow' : ''}`}>
            꼭짓점 <strong className="highlight-num">{morphPts.length}개</strong>
          </span>
          <span className="geo-divider">/</span>
          <span className="geo-stat-item edge-highlight">
            변 <strong className="highlight-num">{morphPts.length}개</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
