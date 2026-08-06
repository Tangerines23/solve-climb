import React from 'react';

export interface ShapeVisualizerProps {
  sides?: number;
  showDiagonals?: boolean;
  shapeType?: 'n-gon' | 'triangle' | 'parallelogram' | 'quadrilateral' | 'rect' | 'circle';
  width?: number;
  height?: number;
  base?: number;
  radius?: number;
  angleA?: number;
  angleB?: number;
  angleC?: number;
}

export const ShapeVisualizer: React.FC<ShapeVisualizerProps> = ({
  sides = 5,
  shapeType = 'n-gon',
  width,
  height,
  base,
  angleA,
  angleB,
  angleC,
}) => {
  // 아담하고 컴팩트한 규격 (키패드가 내려가지 않도록 110px 세팅)
  const size = 110;
  const center = size / 2;

  // 1. 다각형 (n-gon) 모드 (Level 1 꼭짓점, Level 2 다각형)
  if (shapeType === 'n-gon') {
    const n = Math.max(3, sides);
    const r = 38; // 110px 규격에 맞춘 반지름
    const points: { x: number; y: number }[] = [];
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < n; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / n;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      points.push({ x, y });
    }

    const pointsString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 꼭짓점 점 (미니멀 닷: r=2.5) */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill="#818CF8"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    );
  }

  // 2. 삼각형 모드 (Level 3 내각, Level 6 넓이)
  if (shapeType === 'triangle') {
    const top = { x: 55, y: 20 };
    const left = { x: 18, y: 88 };
    const right = { x: 92, y: 88 };
    const pointsString = `${top.x},${top.y} ${left.x},${left.y} ${right.x},${right.y}`;

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 치수선 (base, height) 이 있는 경우 */}
          {base !== undefined && height !== undefined && (
            <>
              <line
                x1={top.x}
                y1={top.y}
                x2={top.x}
                y2={left.y}
                stroke="#FB7185"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <text x={top.x - 14} y={(top.y + left.y) / 2 + 2} fill="#FB7185" fontSize={9} fontWeight={800}>
                h={height}
              </text>
              <text x={(left.x + right.x) / 2} y={left.y + 14} fill="#38BDF8" fontSize={9} fontWeight={800} textAnchor="middle">
                b={base}
              </text>
            </>
          )}

          {/* 내각 표시 (angleA, angleB) */}
          {angleA !== undefined && (
            <text x={left.x + 8} y={left.y - 4} fill="#38BDF8" fontSize={9} fontWeight={800}>
              {angleA}°
            </text>
          )}
          {angleB !== undefined && (
            <text x={right.x - 18} y={right.y - 4} fill="#38BDF8" fontSize={9} fontWeight={800}>
              {angleB}°
            </text>
          )}
          {angleA !== undefined && angleB !== undefined && (
            <text x={top.x - 6} y={top.y + 16} fill="#F43F5E" fontSize={10} fontWeight={900}>
              ?°
            </text>
          )}

          <circle cx={top.x} cy={top.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={left.x} cy={left.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={right.x} cy={right.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // 3. 일반 사각형 (Level 4 사각형 내각의 합 A, B, C -> ?)
  if (shapeType === 'quadrilateral') {
    const p1 = { x: 30, y: 25 };
    const p2 = { x: 88, y: 22 };
    const p3 = { x: 80, y: 86 };
    const p4 = { x: 22, y: 82 };
    const pointsString = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {angleA !== undefined && (
            <text x={p4.x + 8} y={p4.y - 4} fill="#38BDF8" fontSize={9} fontWeight={800}>
              {angleA}°
            </text>
          )}
          {angleB !== undefined && (
            <text x={p1.x + 8} y={p1.y + 14} fill="#38BDF8" fontSize={9} fontWeight={800}>
              {angleB}°
            </text>
          )}
          {angleC !== undefined && (
            <text x={p2.x - 20} y={p2.y + 14} fill="#38BDF8" fontSize={9} fontWeight={800}>
              {angleC}°
            </text>
          )}
          <text x={p3.x - 16} y={p3.y - 4} fill="#F43F5E" fontSize={10} fontWeight={900}>
            ?°
          </text>

          <circle cx={p1.x} cy={p1.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={p2.x} cy={p2.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={p3.x} cy={p3.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={p4.x} cy={p4.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // 4. 평행사변형 모드 (Level 4 성질)
  if (shapeType === 'parallelogram') {
    const p1 = { x: 35, y: 25 };
    const p2 = { x: 95, y: 25 };
    const p3 = { x: 75, y: 85 };
    const p4 = { x: 15, y: 85 };
    const pointsString = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;

    return (
      <div className="shape-visualizer-container" style={containerStyle}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgShadowStyle}>
          <polygon
            points={pointsString}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {angleA !== undefined && (
            <text x={p4.x + 8} y={p4.y - 4} fill="#F43F5E" fontSize={10} fontWeight={900}>
              {angleA}°
            </text>
          )}
          <circle cx={p1.x} cy={p1.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={p2.x} cy={p2.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={p3.x} cy={p3.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx={p4.x} cy={p4.y} r="2.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // 5. 직사각형 모드 (Level 5 넓이)
  if (shapeType === 'rect') {
    const rectX = 22;
    const rectY = 28;
    const rectW = 66;
    const rectH = 50;

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
            strokeWidth="2.5"
            rx="3"
          />
          {width !== undefined && (
            <text x={rectX + rectW / 2} y={rectY - 6} fill="#38BDF8" fontSize={9} fontWeight={800} textAnchor="middle">
              가로 {width}
            </text>
          )}
          {height !== undefined && (
            <text x={rectX + rectW + 12} y={rectY + rectH / 2 + 3} fill="#FB7185" fontSize={9} fontWeight={800} textAnchor="middle">
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
  margin: '2px 0',
};

const svgShadowStyle: React.CSSProperties = {
  filter: 'drop-shadow(0px 3px 8px rgba(99, 102, 241, 0.35))',
};
