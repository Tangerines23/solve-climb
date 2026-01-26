import { motion } from 'framer-motion';
import './Expert.css';

interface IntegralVisualizerProps {
  hintData: {
    type: 'power' | 'simple';
    coeff?: number;
    power?: number;
    value?: number; // for simple constant function
    x: number; // integration limit (0 to x)
  };
}

export function IntegralVisualizer({ hintData }: IntegralVisualizerProps) {
  // Determine curve points based on function type
  const functionFn = (x: number) => {
    if (hintData.type === 'power') {
      const h = hintData;
      return (h.coeff || 1) * Math.pow(x, h.power || 1);
    } else {
      return hintData.value || 1;
    }
  };

  // SVG scaling constants
  const WIDTH = 300;
  const HEIGHT = 200;
  const PADDING = 20;

  // Scale mapping (simplified for demo range)
  // Max X usually around 3-5 for these problems, Y can get large (e.g., 3^3=27)
  // We'll normalize to fit visible area.
  const maxX = Math.max(hintData.x, 3) * 1.2;
  const maxY = Math.max(functionFn(hintData.x), 10) * 1.2;

  const scaleX = (val: number) => PADDING + (val / maxX) * (WIDTH - 2 * PADDING);
  const scaleY = (val: number) => HEIGHT - PADDING - (val / maxY) * (HEIGHT - 2 * PADDING);

  // Generate Path for the function curve
  const generatePath = () => {
    let path = `M ${scaleX(0)} ${scaleY(functionFn(0))}`;
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const xVal = (i / steps) * maxX;
      path += ` L ${scaleX(xVal)} ${scaleY(functionFn(xVal))}`;
    }
    return path;
  };

  // Generate Area Path (closed loop) for filling
  const generateAreaPath = (limitX: number) => {
    let path = `M ${scaleX(0)} ${scaleY(0)}`; // Start at origin
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const xVal = (i / steps) * limitX;
      path += ` L ${scaleX(xVal)} ${scaleY(functionFn(xVal))}`;
    }
    path += ` L ${scaleX(limitX)} ${scaleY(0)} Z`; // Close loop down to x-axis
    return path;
  };

  return (
    <div className="integral-visualizer">
      <svg width={WIDTH} height={HEIGHT} className="integral-graph">
        {/* Axes */}
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          stroke="var(--color-white)"
          strokeWidth="2"
        />
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={PADDING}
          y2={PADDING}
          stroke="var(--color-white)"
          strokeWidth="2"
        />

        {/* Function Curve */}
        <path
          d={generatePath()}
          stroke="var(--color-teal-400)"
          strokeWidth="3"
          fill="none"
          opacity="0.5"
        />

        {/* Filled Area (Animated) */}
        <motion.path
          d={generateAreaPath(hintData.x)}
          fill="rgba(78, 205, 196, 0.5)"
          stroke="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* X-Label */}
        <text
          x={scaleX(hintData.x)}
          y={HEIGHT - 5}
          fill="var(--color-white)"
          fontSize="12"
          textAnchor="middle"
        >
          x={hintData.x}
        </text>
      </svg>
      <div className="integral-label">Area = ∫ f(x) dx</div>
    </div>
  );
}
