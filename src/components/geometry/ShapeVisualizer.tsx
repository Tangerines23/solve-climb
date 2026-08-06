import React from 'react';

export interface ShapeVisualizerProps {
  sides?: number;
  showDiagonals?: boolean;
  shapeType?: 'n-gon' | 'triangle' | 'parallelogram' | 'rect' | 'circle';
  width?: number;
  height?: number;
  base?: number;
  radius?: number;
  angleA?: number;
  angleB?: number;
}

export const ShapeVisualizer: React.FC<ShapeVisualizerProps> = ({
  sides = 5,
  showDiagonals = false,
  shapeType = 'n-gon',
  width,
  height,
  base,
  radius,
  angleA,
  angleB,
}) => {
  const size = 170;
  const center = size / 2;

  // 1. 다각형 (n-gon) 모드 (Level 1 꼭짓점, Level 2 대각선)
  if (shapeType === 'n-gon') {
    const n = Math.max(3, sides);
    const r = 55;
    const points: { x: number; y: number }[] = [];
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < n; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / n;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      points.push({ x, y });
    }

    const pointsString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // 대각선 리스트 구하기
    const diagonals: { x1: number; y1: number; x2: number; y2: number }[] = [];
    if (showDiagonals && n >= 4) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue; // 이웃한 꼭짓점은 변
          diagonals.push({
            x1: points[i]!.x,
            y1: points[i]!.y,
            x2: points[j]!.x,
            y2: points[j]!.y,
          });
        }
      }
    }

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          {/* 채우기 및 메인 외곽선 */}
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* 대각선 (Lines) */}
          {showDiagonals &&
            diagonals.map((d, idx) => (
              <line
                key={idx}
                x1={d.x1}
                y1={d.y1}
                x2={d.x2}
                y2={d.y2}
                stroke="#F43F5E"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity={0.85}
              />
            ))}

          {/* 꼭짓점 점 (Dots) */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="5.5"
              fill="#818CF8"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
    );
  }

  // 2. 삼각형 모드 (Level 3 내각, Level 6 넓이)
  if (shapeType === 'triangle') {
    const top = { x: 95, y: 35 };
    const left = { x: 30, y: 130 };
    const right = { x: 145, y: 130 };
    const pointsString = `${top.x},${top.y} ${left.x},${left.y} ${right.x},${right.y}`;

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* 치수선 (base, height) 이 있는 경우 */}
          {base !== undefined && height !== undefined && (
            <>
              {/* 높이 수직선 */}
              <line
                x1={top.x}
                y1={top.y}
                x2={top.x}
                y2={left.y}
                stroke="#FB7185"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <text
                x={top.x - 16}
                y={(top.y + left.y) / 2}
                fill="#FB7185"
                fontSize={11}
                fontWeight={800}
              >
                h={height}
              </text>
              <text
                x={(left.x + right.x) / 2}
                y={left.y + 18}
                fill="#38BDF8"
                fontSize={11}
                fontWeight={800}
                textAnchor="middle"
              >
                b={base}
              </text>
            </>
          )}

          {/* 내각 표시 (angleA, angleB) */}
          {angleA !== undefined && (
            <text x={left.x + 14} y={left.y - 8} fill="#38BDF8" fontSize={11} fontWeight={800}>
              {angleA}°
            </text>
          )}
          {angleB !== undefined && (
            <text x={right.x - 24} y={right.y - 8} fill="#38BDF8" fontSize={11} fontWeight={800}>
              {angleB}°
            </text>
          )}
          {angleA !== undefined && angleB !== undefined && (
            <text x={top.x - 8} y={top.y + 22} fill="#F43F5E" fontSize={12} fontWeight={900}>
              ?°
            </text>
          )}

          <circle cx={top.x} cy={top.y} r="5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx={left.x} cy={left.y} r="5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx={right.x} cy={right.y} r="5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // 3. 평행사변형 모드 (Level 4 성질)
  if (shapeType === 'parallelogram') {
    const p1 = { x: 50, y: 45 };
    const p2 = { x: 140, y: 45 };
    const p3 = { x: 120, y: 125 };
    const p4 = { x: 30, y: 125 };
    const pointsString = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {angleA !== undefined && (
            <text x={p4.x + 14} y={p4.y - 8} fill="#F43F5E" fontSize={12} fontWeight={900}>
              {angleA}°
            </text>
          )}
          <circle cx={p1.x} cy={p1.y} r="4.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx={p2.x} cy={p2.y} r="4.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx={p3.x} cy={p3.y} r="4.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx={p4.x} cy={p4.y} r="4.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // 4. 직사각형 모드 (Level 5 넓이)
  if (shapeType === 'rect') {
    const rectX = 35;
    const rectY = 45;
    const rectW = 100;
    const rectH = 75;

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <rect
            x={rectX}
            y={rectY}
            width={rectW}
            height={rectH}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="3.5"
            rx="4"
          />
          {width !== undefined && (
            <text
              x={rectX + rectW / 2}
              y={rectY - 8}
              fill="#38BDF8"
              fontSize={11}
              fontWeight={800}
              textAnchor="middle"
            >
              가로 {width}
            </text>
          )}
          {height !== undefined && (
            <text
              x={rectX + rectW + 18}
              y={rectY + rectH / 2 + 4}
              fill="#FB7185"
              fontSize={11}
              fontWeight={800}
              textAnchor="middle"
            >
              세로 {height}
            </text>
          )}
        </svg>
      </div>
    );
  }

  return null;
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '8px 0',
};

const svgShadowStyle: React.CSSProperties = {
  filter: 'drop-shadow(0px 4px 12px rgba(99, 102, 241, 0.4))',
};
