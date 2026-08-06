// 고정값 허용: SVG 도형 시각화 전용 고유 색상 및 스타일
import React from 'react';

interface ShapeVisualizerProps {
  sides: number;
}

export const ShapeVisualizer: React.FC<ShapeVisualizerProps> = ({ sides }) => {
  const size = 160;
  const center = size / 2;
  const radius = 55;
  const points: { x: number; y: number }[] = [];

  // Generate regular n-gon vertices
  const startAngle = -Math.PI / 2; // Start pointing up
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push({ x, y });
  }

  const pointsString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '12px 0',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          filter: 'drop-shadow(0px 4px 12px rgba(99, 102, 241, 0.4))',
        }}
      >
        {/* Fill and Stroke Polygon */}
        <polygon
          points={pointsString}
          fill="rgba(99, 102, 241, 0.15)"
          stroke="#6366F1"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Draw Vertex Dots */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#818CF8"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
};
