import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';

export const GameOverlay: React.FC = () => {
  const { showVignette, showSpeedLines: storeShowSpeedLines, feverLevel: storeFeverLevel, speedLineStyle, setSpeedLineStyle } =
    useGameStore();

  const [activeStyleMsg, setActiveStyleMsg] = useState<string | null>(null);

  // 프리뷰 모드(테스트용) 여부 확인: URL 파라미터 혹은 미리보기 모달 감지
  const isPreviewEnvironment = 
    typeof window !== 'undefined' && 
    (window.location.search.includes('preview=true') || !!document.querySelector('.keyboard-info-modal'));

  const showSpeedLines = storeShowSpeedLines || isPreviewEnvironment;
  const feverLevel = storeFeverLevel || (isPreviewEnvironment ? 1 : 0);

  // 80% 어두운 배경(dimming) 및 마스크가 필요한 고전 스타일
  const needsDimmingAndMask = speedLineStyle === 'original' || speedLineStyle === 'wind' || speedLineStyle === 'fog';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const styles: ('original' | 'wind' | 'fog' | 'glow' | 'float' | 'liquid' | 'chalk' | 'sweep' | 'zen')[] = [
          'original',
          'wind',
          'fog',
          'glow',
          'float',
          'liquid',
          'chalk',
          'sweep',
          'zen',
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
          fog: 'Focus Edge Fog',
          glow: 'Subtle Edge Glow',
          float: 'Card Float & Depth',
          liquid: 'Liquid Border Gauge',
          chalk: 'Chalk Powder Dust',
          sweep: 'Light Sweep Scan',
          zen: 'Zen Focus Blur',
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
            background: 'transparent',
            maskImage: needsDimmingAndMask ? 'radial-gradient(circle, transparent 35%, black 75%)' : undefined,
            WebkitMaskImage: needsDimmingAndMask ? 'radial-gradient(circle, transparent 35%, black 75%)' : undefined,
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
                  x2="25%"
                  y2="25%"
                  className="speed-line"
                  style={{ animationDelay: '0s' }}
                />
                <line
                  x1="95%"
                  y1="5%"
                  x2="75%"
                  y2="25%"
                  className="speed-line"
                  style={{ animationDelay: '0.1s' }}
                />
                <line
                  x1="5%"
                  y1="95%"
                  x2="25%"
                  y2="75%"
                  className="speed-line"
                  style={{ animationDelay: '0.2s' }}
                />
                <line
                  x1="95%"
                  y1="95%"
                  x2="75%"
                  y2="75%"
                  className="speed-line"
                  style={{ animationDelay: '0.3s' }}
                />
                <line
                  x1="50%"
                  y1="0%"
                  x2="50%"
                  y2="20%"
                  className="speed-line"
                  style={{ animationDelay: '0.15s' }}
                />
                <line
                  x1="50%"
                  y1="100%"
                  x2="50%"
                  y2="80%"
                  className="speed-line"
                  style={{ animationDelay: '0.35s' }}
                />
                <line
                  x1="0%"
                  y1="50%"
                  x2="20%"
                  y2="50%"
                  className="speed-line"
                  style={{ animationDelay: '0.05s' }}
                />
                <line
                  x1="100%"
                  y1="50%"
                  x2="80%"
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

            {feverLevel === 1 && speedLineStyle === 'fog' && (
              <g className="fog-effects">
                <style>{`
                  @keyframes fogPulse {
                    0%, 100% { opacity: 0.55; }
                    50% { opacity: 0.9; }
                  }
                  .fog-vignette {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    box-shadow: inset 0 0 120px rgba(255, 255, 255, 0.55), inset 0 0 50px rgba(255, 255, 255, 0.35);
                    animation: fogPulse 2.5s infinite ease-in-out;
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="fog-vignette" />
                </foreignObject>
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'glow' && (
              <g className="glow-effects">
                <style>{`
                  @keyframes glowPulse {
                    0%, 100% {
                      opacity: 0.25;
                      box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.15), 0 0 8px rgba(255, 255, 255, 0.1);
                    }
                    50% {
                      opacity: 0.65;
                      box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.35), 0 0 15px rgba(255, 255, 255, 0.25);
                    }
                  }
                  .glow-container {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    right: 8px;
                    bottom: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: var(--rounded-md);
                    animation: glowPulse 2.5s infinite ease-in-out;
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="glow-container" />
                </foreignObject>
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'float' && (
              <g className="float-effects">
                <style>{`
                  .quiz-card, .keyboard-info-modal, .keypad-container {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(255, 255, 255, 0.15) !important;
                    animation: floatBreath 4s infinite ease-in-out !important;
                  }
                  @keyframes floatBreath {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-8px) scale(1.006); }
                  }
                `}</style>
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'liquid' && (
              <g className="liquid-effects">
                <style>{`
                  @keyframes liquidFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                  .liquid-border {
                    position: absolute;
                    top: 6px;
                    left: 6px;
                    right: 6px;
                    bottom: 6px;
                    border: 3px solid transparent;
                    border-radius: var(--rounded-md);
                    background-image: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)),
                                      linear-gradient(90deg, #3b82f6, #f97316, #ec4899, #3b82f6);
                    background-origin: border-box;
                    background-clip: content-box, border-box;
                    background-size: 300% 300%;
                    animation: liquidFlow 4s infinite linear;
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="liquid-border" />
                </foreignObject>
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'chalk' && (
              <g className="chalk-effects">
                <style>{`
                  @keyframes chalkDrift {
                    0% { transform: translateY(-10px) translateX(0) scale(0.8); opacity: 0; }
                    10% { opacity: 0.5; }
                    90% { opacity: 0.5; }
                    100% { transform: translateY(100vh) translateX(30px) scale(1.2); opacity: 0; }
                  }
                  .chalk-particle {
                    animation: chalkDrift 3.5s infinite ease-in-out;
                    fill: rgba(255, 255, 255, 0.45);
                  }
                `}</style>
                <circle cx="10%" cy="-20" r="2.5" className="chalk-particle" style={{ animationDelay: '0s', animationDuration: '3s' }} />
                <circle cx="25%" cy="-20" r="1.5" className="chalk-particle" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
                <circle cx="40%" cy="-20" r="2.0" className="chalk-particle" style={{ animationDelay: '1.2s', animationDuration: '3.5s' }} />
                <circle cx="55%" cy="-20" r="1.8" className="chalk-particle" style={{ animationDelay: '0.2s', animationDuration: '2.8s' }} />
                <circle cx="70%" cy="-20" r="2.2" className="chalk-particle" style={{ animationDelay: '1.8s', animationDuration: '4.2s' }} />
                <circle cx="85%" cy="-20" r="1.2" className="chalk-particle" style={{ animationDelay: '0.8s', animationDuration: '3.2s' }} />
                <circle cx="95%" cy="-20" r="2.0" className="chalk-particle" style={{ animationDelay: '2.2s', animationDuration: '3.7s' }} />
                <circle cx="18%" cy="-20" r="2.5" className="chalk-particle" style={{ animationDelay: '2.8s', animationDuration: '3.1s' }} />
                <circle cx="33%" cy="-20" r="1.5" className="chalk-particle" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }} />
                <circle cx="48%" cy="-20" r="2.0" className="chalk-particle" style={{ animationDelay: '3.2s', animationDuration: '3.3s' }} />
                <circle cx="63%" cy="-20" r="1.8" className="chalk-particle" style={{ animationDelay: '0.9s', animationDuration: '3.8s' }} />
                <circle cx="78%" cy="-20" r="2.2" className="chalk-particle" style={{ animationDelay: '2.5s', animationDuration: '3.6s' }} />
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'sweep' && (
              <g className="sweep-effects">
                <style>{`
                  @keyframes sweepMove {
                    0% { clip-path: inset(0 100% 100% 0); }
                    25% { clip-path: inset(0 0 100% 0); }
                    50% { clip-path: inset(0 0 0 0); }
                    75% { clip-path: inset(100% 0 0 0); }
                    100% { clip-path: inset(100% 0 0 100%); }
                  }
                  .sweep-border {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    right: 4px;
                    bottom: 4px;
                    border: 2px solid rgba(255, 255, 255, 0.85);
                    border-radius: var(--rounded-md);
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
                    animation: sweepMove 3s infinite linear;
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="sweep-border" />
                </foreignObject>
              </g>
            )}

            {feverLevel === 1 && speedLineStyle === 'zen' && (
              <g className="zen-effects">
                <style>{`
                  .zen-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    mask-image: radial-gradient(circle, transparent 35%, black 75%);
                    -webkit-mask-image: radial-gradient(circle, transparent 35%, black 75%);
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="zen-overlay" />
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
