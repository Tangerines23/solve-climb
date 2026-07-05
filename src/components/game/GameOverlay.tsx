import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useToastStore } from '../../stores/useToastStore';

export const GameOverlay: React.FC = () => {
  const { showVignette, showSpeedLines: storeShowSpeedLines, feverLevel: storeFeverLevel, speedLineStyle, setSpeedLineStyle } =
    useGameStore();

  const showSpeedLines = storeShowSpeedLines;
  const feverLevel = storeFeverLevel;

  const [prevFever, setPrevFever] = useState(0);
  const [splashText, setSplashText] = useState<string | null>(null);
  const [splashKey, setSplashKey] = useState(0);

  useEffect(() => {
    if (feverLevel > prevFever && feverLevel > 0) {
      const text = feverLevel === 2 ? 'SECOND WIND' : 'MOMENTUM';
      setSplashText(text);
      setSplashKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setSplashText(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setPrevFever(feverLevel);
  }, [feverLevel, prevFever]);

  // 80% 어두운 배경(dimming) 및 마스크가 필요한 고전 스타일
  const needsDimmingAndMask = speedLineStyle === 'original' || speedLineStyle === 'wind' || speedLineStyle === 'fog';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        const currentFever = useGameStore.getState().feverLevel;
        const nextFever = currentFever === 0 ? 1 : currentFever === 1 ? 2 : 0;
        
        setPrevFever(0);
        useGameStore.setState({ showSpeedLines: nextFever > 0, feverLevel: nextFever });
        
        const { showToast } = useToastStore.getState();
        if (nextFever === 1) {
          showToast('1단계 효과');
        } else if (nextFever === 2) {
          showToast('2단계 효과');
        } else {
          showToast('효과 비활성화');
          setSplashText(null);
        }
      }

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

        const styleNames: Record<string, { num: number; desc: string }> = {
          original: { num: 1, desc: '오리지널 스피드라인' },
          wind: { num: 2, desc: '절벽 바람과 먼지' },
          fog: { num: 3, desc: '은은한 화면 외곽 안개' },
          glow: { num: 4, desc: '얇은 테두리 네온 펄스' },
          float: { num: 5, desc: '카드 입체 플로팅' },
          liquid: { num: 6, desc: '테두리 액체 충전 바' },
          chalk: { num: 7, desc: '초크 가루 중력 낙하' },
          sweep: { num: 8, desc: '테두리 라이트 스윕' },
          zen: { num: 9, desc: '젠 포커스 아웃 비네트' },
        };
        const { num, desc } = styleNames[newStyle];
        useToastStore.getState().showToast(`${num}번 효과: ${desc}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [speedLineStyle, setSpeedLineStyle, prevFever]);

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

      {/* Fever Entrance Splash Banner (Fades out after 1.5s to prevent distraction) */}
      {splashText && (
        <div
          key={splashKey}
          style={{
            position: 'fixed',
            top: '8%',
            left: '50%',
            transform: 'translate(-50%, 0)',
            color: splashText === 'SECOND WIND' ? 'var(--color-yellow-400)' : 'var(--color-white)',
            fontSize: '26px',
            fontWeight: '900',
            textShadow: '0 0 15px rgba(0, 0, 0, 0.9), 0 0 5px rgba(0, 0, 0, 0.9)',
            zIndex: 3000,
            pointerEvents: 'none',
            animation: 'splashAnim 1.5s forwards ease-out',
            whiteSpace: 'nowrap',
            letterSpacing: '1px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <span style={{ fontSize: '28px' }}>{splashText === 'SECOND WIND' ? '🔥' : '⚡'}</span>
            <span>{splashText}</span>
            <span style={{ fontSize: '28px' }}>{splashText === 'SECOND WIND' ? '🔥' : '⚡'}</span>
          </div>
          <style>{`
            @keyframes splashAnim {
              0% { transform: translate(-50%, -10px) scale(0.8); opacity: 0; filter: blur(3px); }
              15% { transform: translate(-50%, 0) scale(1.05); opacity: 1; filter: blur(0); }
              30% { transform: translate(-50%, 0) scale(1); opacity: 1; }
              80% { transform: translate(-50%, 0) scale(1); opacity: 1; }
              100% { transform: translate(-50%, -15px) scale(0.95); opacity: 0; filter: blur(2px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};
