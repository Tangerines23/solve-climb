import React from 'react';
import { useGameStore } from '../../stores/useGameStore';

export const GameOverlay: React.FC = () => {
  const { showVignette, showSpeedLines, feverLevel } = useGameStore();

  return (
    <>
      {/* Exhausted Vignette & Desaturation Effect */}
      {showVignette && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 150px rgba(255, 0, 0, 0.4)',
              zIndex: 1000,
              transition: 'all 0.5s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              backdropFilter: 'saturate(0.5) blur(1px)',
              zIndex: 998,
            }}
          />
        </>
      )}

      {/* Speed Lines Effect (Fever Mode) */}
      {showSpeedLines && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 999,
            overflow: 'hidden',
            background:
              feverLevel === 2
                ? 'radial-gradient(circle, transparent 40%, rgba(255, 215, 0, 0.1) 100%)'
                : 'none',
          }}
        >
          <svg width="100%" height="100%">
            <defs>
              <linearGradient id="speedLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={feverLevel === 2 ? '#FFD700' : '#FFFFFF'}
                  stopOpacity="0.4"
                />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <g className="speed-lines">
              <style>{`
                @keyframes speedMove {
                  0% { transform: scale(1); opacity: 0; }
                  50% { opacity: 0.3; }
                  100% { transform: scale(1.4); opacity: 0; }
                }
                .speed-line {
                  animation: speedMove 0.8s infinite linear;
                  stroke: ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
                  stroke-width: 1.5;
                  transform-origin: center;
                }
              `}</style>
              <line
                x1="5%"
                y1="5%"
                x2="45%"
                y2="45%"
                className="speed-line"
                style={{ animationDelay: '0s' }}
              />
              <line
                x1="95%"
                y1="5%"
                x2="55%"
                y2="45%"
                className="speed-line"
                style={{ animationDelay: '0.1s' }}
              />
              <line
                x1="5%"
                y1="95%"
                x2="45%"
                y2="55%"
                className="speed-line"
                style={{ animationDelay: '0.2s' }}
              />
              <line
                x1="95%"
                y1="95%"
                x2="55%"
                y2="55%"
                className="speed-line"
                style={{ animationDelay: '0.3s' }}
              />

              <line
                x1="50%"
                y1="0%"
                x2="50%"
                y2="40%"
                className="speed-line"
                style={{ animationDelay: '0.15s' }}
              />
              <line
                x1="50%"
                y1="100%"
                x2="50%"
                y2="60%"
                className="speed-line"
                style={{ animationDelay: '0.35s' }}
              />
              <line
                x1="0%"
                y1="50%"
                x2="40%"
                y2="50%"
                className="speed-line"
                style={{ animationDelay: '0.05s' }}
              />
              <line
                x1="100%"
                y1="50%"
                x2="60%"
                y2="50%"
                className="speed-line"
                style={{ animationDelay: '0.25s' }}
              />
            </g>
          </svg>
        </div>
      )}

      {/* Fever Text/Effect */}
      {feverLevel > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: feverLevel === 2 ? '#FFD700' : '#FFFFFF',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
            zIndex: 1001,
            pointerEvents: 'none',
            animation: 'pulse 1s infinite',
          }}
        >
          {feverLevel === 2 ? '🔥 SECOND WIND 🔥' : '⚡ MOMENTUM ⚡'}
          <style>{`
            @keyframes pulse {
              0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
              50% { transform: translateX(-50%) scale(1.05); opacity: 1; }
              100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};
