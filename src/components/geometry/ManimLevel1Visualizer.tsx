import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { ManimCardLayout } from './ManimCardLayout';
import './GeometryTipVisualizer.css';
import { computeMorphedPolygonVertices, computeRegularVertices } from './manimGeometryUtils';

const SIZE = 200;

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

interface ShapeConfig {
  sides: number;
  name: string;
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  { sides: 3, name: '삼각형' },
  { sides: 4, name: '사각형' },
  { sides: 5, name: '오각형' },
  { sides: 6, name: '육각형' },
  { sides: 7, name: '칠각형' },
  { sides: 8, name: '팔각형' },
];

const PRECOMPUTED_VERTICES: Record<number, { x: number; y: number }[]> = {
  3: computeRegularVertices(3),
  4: computeRegularVertices(4),
  5: computeRegularVertices(5),
  6: computeRegularVertices(6),
  7: computeRegularVertices(7),
  8: computeRegularVertices(8),
};

export const ManimLevel1Visualizer: React.FC = React.memo(() => {
  const isAdminMode = useDebugStore((state) => state.isAdminMode);

  const [shapeIdx, setShapeIdx] = useState(0);
  const [prevSides, setPrevSides] = useState(3);
  const [currSides, setCurrSides] = useState(3);
  const [progress, setProgress] = useState(0);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const dragStartXRef = useRef<number | null>(null);

  const animStateRef = useRef<{
    startTime: number | null;
    accumulatedPauseTime: number;
    pauseStart: number | null;
  }>({
    startTime: null,
    accumulatedPauseTime: 0,
    pauseStart: null,
  });

  useEffect(() => {
    animStateRef.current = {
      startTime: null,
      accumulatedPauseTime: 0,
      pauseStart: null,
    };
  }, [shapeIdx]);

  const triggerStepChange = useCallback((direction: 'next' | 'prev') => {
    setShapeIdx((idx) => {
      const nextIdx =
        direction === 'next'
          ? (idx + 1) % SHAPE_CONFIGS.length
          : (idx - 1 + SHAPE_CONFIGS.length) % SHAPE_CONFIGS.length;
      const currentConfig = SHAPE_CONFIGS.at(idx);
      const nextConfig = SHAPE_CONFIGS.at(nextIdx);
      if (currentConfig && nextConfig) {
        setPrevSides(currentConfig.sides);
        setCurrSides(nextConfig.sides);
      }
      return nextIdx;
    });
    setProgress(0);
    setHighlightIdx(null);
  }, []);

  useEffect(() => {
    let animId: number;
    const MORPH_DURATION = 1200;
    const HIGHLIGHT_STEP_DURATION = 650;
    const REST_PAUSE_DURATION = 500;

    const highlightTotalDuration = currSides * HIGHLIGHT_STEP_DURATION;
    const totalCycleDuration = MORPH_DURATION + highlightTotalDuration + REST_PAUSE_DURATION;

    const updateMorphAndHighlight = (elapsed: number) => {
      if (elapsed <= MORPH_DURATION) {
        setProgress(easeOutCubic(elapsed / MORPH_DURATION));
        setHighlightIdx(null);
        return;
      }
      if (elapsed <= MORPH_DURATION + currSides * HIGHLIGHT_STEP_DURATION) {
        setProgress(1);
        const highlightElapsed = elapsed - MORPH_DURATION;
        const currentStep = Math.floor(highlightElapsed / HIGHLIGHT_STEP_DURATION);
        setHighlightIdx(Math.min(currentStep, currSides - 1));
        return;
      }
      setProgress(1);
      setHighlightIdx(null);
    };

    const tick = (timestamp: number) => {
      if (isPausedRef.current) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const state = animStateRef.current;
      if (state.startTime === null) state.startTime = timestamp;
      const elapsed = timestamp - state.startTime - state.accumulatedPauseTime;

      updateMorphAndHighlight(elapsed);

      if (elapsed < totalCycleDuration) {
        animId = requestAnimationFrame(tick);
        return;
      }
      triggerStepChange('next');
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shapeIdx, currSides, prevSides, triggerStepChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const dx = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;

    if (Math.abs(dx) <= 30) {
      setIsPaused((p) => !p);
      return;
    }
    if (dx < 0) {
      triggerStepChange('next');
      return;
    }
    triggerStepChange('prev');
  };

  const morphPts = useMemo(
    () => computeMorphedPolygonVertices(currSides, prevSides, progress, PRECOMPUTED_VERTICES),
    [currSides, prevSides, progress]
  );

  const currentConfig = SHAPE_CONFIGS.at(shapeIdx) ?? SHAPE_CONFIGS[0]!;
  const ptsStr = useMemo(
    () => morphPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    [morphPts]
  );

  const caption = (
    <div className="geo-stat-highlights">
      <span
        className={`geo-stat-item vertex-highlight ${
          progress >= 1 && highlightIdx !== null ? 'active-glow' : ''
        }`}
      >
        꼭짓점{' '}
        <strong key={`v-${morphPts.length}`} className="highlight-num geo-text-mode-1">
          {morphPts.length}
        </strong>
        개
      </span>
      <span className="geo-divider">/</span>
      <span className="geo-stat-item edge-highlight">
        변{' '}
        <strong key={`e-${morphPts.length}`} className="highlight-num geo-text-mode-1">
          {morphPts.length}
        </strong>
        개
      </span>
    </div>
  );

  return (
    <div
      onPointerDown={(e) => {
        dragStartXRef.current = e.clientX;
      }}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'pan-y', userSelect: 'none' }}
    >
      <ManimCardLayout
        badgeName={currentConfig.name}
        isPaused={isPaused}
        onTogglePause={() => {}}
        captionContent={caption}
      >
        <svg width={SIZE} height={165} viewBox={`0 0 ${SIZE} 165`} className="geo-tip-svg">
          <polygon points={ptsStr} className="geo-shape-poly-morph" />

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

          {morphPts.map((p, idx) => {
            const isHighlighted = progress >= 1 && highlightIdx === idx;
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

          {morphPts.length > 0 && (
            <g className="geo-label-pointer">
              <text
                x={morphPts[0]!.x}
                y={morphPts[0]!.y - 14}
                className="geo-pointer-tag vertex-tag"
              >
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

          {isAdminMode && <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="#c084fc" />}
        </svg>
      </ManimCardLayout>
    </div>
  );
});
