import React, { useEffect, useState } from 'react';
import './CalculusVisualization.css';

interface CalculusVisualizationProps {
  type: 'limit' | 'derivative';
  func?: string;
}

export const CalculusVisualization: React.FC<CalculusVisualizationProps> = ({ type }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 0.01) % 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const renderLimit = () => {
    // Basic 1/x curve animation
    const points = [];
    for (let x = 10; x < 190; x += 5) {
      const y = 80 / (x / 20) + 20; // 1/x shape
      points.push(`${x},${y}`);
    }

    const currentX = 10 + progress * 170;
    const currentY = 80 / (currentX / 20) + 20;

    return (
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d={`M ${points.join(' L ')}`}
          stroke="var(--color-blue-400)"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
        <circle cx={currentX} cy={currentY} r="4" fill="var(--color-blue-500)">
          <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
        </circle>
        {/* Asymptote */}
        <line
          x1="0"
          y1="100"
          x2="200"
          y2="100"
          stroke="var(--color-gray-700)"
          strokeDasharray="4"
        />
        <text x="180" y="115" fontSize="10" fill="var(--color-gray-500)">
          x → ∞
        </text>
      </svg>
    );
  };

  const renderDerivative = () => {
    // Parabola with sliding tangent
    const points = [];
    for (let x = 20; x < 180; x += 5) {
      const rx = (x - 100) / 40;
      const y = rx * rx * 40 + 30;
      points.push(`${x},${y}`);
    }

    const tX = 20 + progress * 160;
    const rtx = (tX - 100) / 40;
    const tY = rtx * rtx * 40 + 30;

    // Slop calculation (derivative of x^2 is 2x)
    const slope = 2 * rtx;

    return (
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d={`M ${points.join(' L ')}`}
          stroke="var(--color-red-400)"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
        {/* Tangent Line */}
        <line
          x1={tX - 30}
          y1={tY - slope * 30}
          x2={tX + 30}
          y2={tY + slope * 30}
          stroke="var(--color-blue-500)"
          strokeWidth="2"
        />
        <circle cx={tX} cy={tY} r="4" fill="var(--color-blue-600)" />
        <text x="10" y="115" fontSize="10" fill="var(--color-gray-500)">
          Tangent (기울기)
        </text>
      </svg>
    );
  };

  return (
    <div className="calculus-viz-container">
      <div className="viz-badge">{type.toUpperCase()} Visual</div>
      {type === 'limit' ? renderLimit() : renderDerivative()}
    </div>
  );
};
