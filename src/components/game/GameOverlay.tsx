import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';

export const GameOverlay: React.FC = () => {
  const { showVignette, showSpeedLines, feverLevel, speedLineStyle, setSpeedLineStyle } =
    useGameStore();

  const [activeStyleMsg, setActiveStyleMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const styles: ('original' | 'wind' | 'rope' | 'fog')[] = [
          'original',
          'wind',
          'rope',
          'fog',
        ];
        const currentIndex = styles.indexOf(speedLineStyle);
        let newIndex = currentIndex;

        if (e.key === 'ArrowLeft') {
          newIndex = (currentIndex - 1 + styles.length) % styles.length;
        } else if (e.key === 'ArrowRight') {
          newIndex = (currentIndex + 1) % styles.length;
        }

        const newStyle = styles[newIndex];
        setSpeedLineStyle(newStyle);

        const styleNames: Record<string, string> = {
          original: 'Original Speedline',
          wind: 'Cliff Wind & Dust',
          rope: 'Rope & Vibration',
          fog: 'Focus Edge Fog',
        };
        setActiveStyleMsg(`Style: ${styleNames[newStyle]}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [speedLineStyle, setSpeedLineStyle]);

  useEffect(() => {
    if (activeStyleMsg) {
      const timer = setTimeout(() => {
        setActiveStyleMsg(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeStyleMsg]);

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
                  stopColor={feverLevel === 2 ? 'var(--color-yellow-400)' : 'var(--color-white)'}
                  stopOpacity="0.4"
                />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {(feverLevel === 2 || speedLineStyle === 'original') && (
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
            )}

            {feverLevel === 1 && speedLineStyle === 'wind' && (
              <g className="wind-particles">
                <style>{`
                  @keyframes windFall {
                    0% { transform: translateY(-100%); opacity: 0; }
                    10% { opacity: 0.4; }
                    90% { opacity: 0.4; }
                    100% { transform: translateY(100vh); opacity: 0; }
                  }
                  @keyframes particleFall {
                    0% { transform: translateY(-10px) translateX(0); opacity: 0; }
                    20% { opacity: 0.6; }
                    80% { opacity: 0.6; }
                    100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
                  }
                  .wind-trail {
                    animation: windFall 1.2s infinite linear;
                    stroke: rgba(255, 255, 255, 0.25);
                    stroke-width: 1;
                  }
                  .dust-particle {
                    animation: particleFall 1.8s infinite linear;
                    fill: rgba(255, 255, 255, 0.4);
                  }
                `}</style>
                <line
                  x1="10%"
                  y1="0"
                  x2="10%"
                  y2="150"
                  className="wind-trail"
                  style={{ animationDelay: '0s', animationDuration: '1.2s' }}
                />
                <line
                  x1="30%"
                  y1="0"
                  x2="30%"
                  y2="200"
                  className="wind-trail"
                  style={{ animationDelay: '0.4s', animationDuration: '1.5s' }}
                />
                <line
                  x1="70%"
                  y1="0"
                  x2="70%"
                  y2="120"
                  className="wind-trail"
                  style={{ animationDelay: '0.2s', animationDuration: '1.1s' }}
                />
                <line
                  x1="90%"
                  y1="0"
                  x2="90%"
                  y2="180"
                  className="wind-trail"
                  style={{ animationDelay: '0.6s', animationDuration: '1.4s' }}
                />

                <circle
                  cx="15%"
                  cy="0"
                  r="2.5"
                  className="dust-particle"
                  style={{ animationDelay: '0.1s', animationDuration: '1.7s' }}
                />
                <circle
                  cx="25%"
                  cy="0"
                  r="1.5"
                  className="dust-particle"
                  style={{ animationDelay: '0.8s', animationDuration: '2.1s' }}
                />
                <circle
                  cx="45%"
                  cy="0"
                  r="2.0"
                  className="dust-particle"
                  style={{ animationDelay: '0.3s', animationDuration: '1.9s' }}
                />
                <circle
                  cx="65%"
                  cy="0"
                  r="1.8"
                  className="dust-particle"
                  style={{ animationDelay: '1.1s', animationDuration: '1.6s' }}
                />
                <circle
                  cx="80%"
                  cy="0"
                  r="2.2"
                  className="dust-particle"
                  style={{ animationDelay: '0.5s', animationDuration: '2.3s' }}
                />
                <circle
                  cx="95%"
                  cy="0"
                  r="1.2"
                  className="dust-particle"
                  style={{ animationDelay: '1.4s', animationDuration: '1.8s' }}
                />
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'rope' && (
              <g className="rope-effects">
                <style>{`
                  @keyframes ropeVibeLeft {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(2px) skewX(0.5deg); }
                    75% { transform: translateX(-2px) skewX(-0.5deg); }
                  }
                  @keyframes ropeVibeRight {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px) skewX(-0.5deg); }
                    75% { transform: translateX(2px) skewX(0.5deg); }
                  }
                  @keyframes ropeGlow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                  }
                  .rope-line {
                    stroke: rgba(255, 255, 255, 0.4);
                    stroke-width: 4;
                    stroke-dasharray: 6 4;
                  }
                  .rope-glow {
                    stroke: rgba(255, 255, 255, 0.15);
                    stroke-width: 8;
                    animation: ropeGlow 2s infinite ease-in-out;
                  }
                  .rope-group-left {
                    animation: ropeVibeLeft 0.15s infinite linear;
                    transform-origin: top left;
                  }
                  .rope-group-right {
                    animation: ropeVibeRight 0.15s infinite linear;
                    transform-origin: top right;
                  }
                `}</style>
                <g className="rope-group-left">
                  <line x1="16" y1="0" x2="16" y2="100%" className="rope-glow" />
                  <line x1="16" y1="0" x2="16" y2="100%" className="rope-line" />
                </g>
                <g className="rope-group-right">
                  <line
                    x1="calc(100% - 16px)"
                    y1="0"
                    x2="calc(100% - 16px)"
                    y2="100%"
                    className="rope-glow"
                  />
                  <line
                    x1="calc(100% - 16px)"
                    y1="0"
                    x2="calc(100% - 16px)"
                    y2="100%"
                    className="rope-line"
                  />
                </g>
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'fog' && (
              <g className="fog-effects">
                <style>{`
                  @keyframes fogPulse {
                    0%, 100% { opacity: 0.35; filter: blur(8px); }
                    50% { opacity: 0.65; filter: blur(12px); }
                  }
                  .fog-vignette {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.25);
                    animation: fogPulse 2.5s infinite ease-in-out;
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="fog-vignette" />
                </foreignObject>
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Fever Text/Effect */}
      {feverLevel > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: feverLevel === 2 ? 'var(--color-yellow-400)' : 'var(--color-white)',
            fontSize: '28px',
            fontWeight: '900',
            textShadow: '0 0 20px rgba(0,0,0,0.8)',
            zIndex: 2000,
            pointerEvents: 'none',
            animation: 'pulse 1s infinite',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
          }}
        >
          <span style={{ fontSize: '32px' }}>{feverLevel === 2 ? '🔥' : '⚡'}</span>
          <span>{feverLevel === 2 ? 'SECOND WIND' : 'MOMENTUM'}</span>
          <span style={{ fontSize: '32px' }}>{feverLevel === 2 ? '🔥' : '⚡'}</span>
          <style>{`
            @keyframes pulse {
              0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
              50% { transform: translateX(-50%) scale(1.05); opacity: 1; }
              100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
            }
          `}</style>
        </div>
      )}
      {/* Speedline style change feedback badge */}
      {activeStyleMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'var(--color-pure-white)',
            padding: 'var(--spacing-xs) var(--spacing-lg)',
            borderRadius: 'var(--rounded-full)',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 3000,
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            animation: 'fadeInOut 1.5s forwards',
          }}
        >
          {activeStyleMsg}
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translate(-50%, 10px); }
              15% { opacity: 1; transform: translate(-50%, 0); }
              85% { opacity: 1; transform: translate(-50%, 0); }
              100% { opacity: 0; transform: translate(-50%, -10px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};
