import React, { useState, useEffect, useContext } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { QuizContext } from '../../features/quiz/contexts/QuizContext';
import { sound } from '../../utils/sound';

export const GameOverlay: React.FC = () => {
  const {
    showVignette,
    showSpeedLines: storeShowSpeedLines,
    feverLevel: storeFeverLevel,
    speedLineStyle,
  } = useGameStore();

  const quizContext = useContext(QuizContext);
  const isTipModalOpen = quizContext ? quizContext.modalState?.showTipModal : false;

  const showSpeedLines = storeShowSpeedLines;
  const feverLevel = storeFeverLevel;

  const [prevFever, setPrevFever] = useState(0);
  const [splashText, setSplashText] = useState<string | null>(null);
  const [splashKey, setSplashKey] = useState(0);

  useEffect(() => {
    if (isTipModalOpen) {
      setSplashText(null);
      setPrevFever(feverLevel);
      return;
    }

    if (feverLevel > prevFever && feverLevel > 0) {
      sound.playFever();
      const text = feverLevel === 2 ? 'SECOND WIND' : 'MOMENTUM';
      setSplashText(text);
      setSplashKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setSplashText(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setPrevFever(feverLevel);
  }, [feverLevel, prevFever, isTipModalOpen]);

  // 80% 어두운 배경(dimming) 및 마스크가 필요한 고전 스타일
  const needsDimmingAndMask =
    speedLineStyle === 'original' ||
    speedLineStyle === 'wind' ||
    speedLineStyle === 'fog' ||
    speedLineStyle === 'liquid';

  return (
    <>
      {/* 1단계: 플로팅 단독 / 2단계: 플로팅 + 황금 발광 및 테두리 효과 */}
      {feverLevel > 0 && speedLineStyle === 'float' && (
        <style>{`
          .quiz-content {
            overflow: visible !important;
          }
          .quiz-card, .keyboard-info-modal, .keypad-container {
            box-shadow: ${
              feverLevel === 2
                ? '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.45), 0 0 40px rgba(255, 215, 0, 0.25) !important'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.75) !important'
            };
            animation: ${feverLevel === 2 ? 'floatBreathGold' : 'floatBreath'} 5s infinite ease-in-out !important;
            ${feverLevel === 2 ? 'border: 2px solid rgba(255, 215, 0, 0.85) !important;' : ''}
            transition: border 0.3s ease, box-shadow 0.3s ease !important;
          }
          @keyframes floatBreath {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-4px) scale(1.003); }
          }
          @keyframes floatBreathGold {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-5px) scale(1.004); }
          }
        `}</style>
      )}
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
            maskImage: needsDimmingAndMask
              ? 'radial-gradient(circle, transparent 35%, black 75%)'
              : undefined,
            WebkitMaskImage: needsDimmingAndMask
              ? 'radial-gradient(circle, transparent 35%, black 75%)'
              : undefined,
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
            {feverLevel > 0 && speedLineStyle === 'original' && (
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

            {feverLevel > 0 && speedLineStyle === 'fog' && (
              <g className="fog-effects">
                <style>{`
                  @keyframes fogPulse {
                    0%, 100% { opacity: ${feverLevel === 2 ? 0.22 : 0.15}; }
                    50% { opacity: ${feverLevel === 2 ? 0.45 : 0.3}; }
                  }
                  .fog-vignette {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    box-shadow: inset 0 0 60px ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 255, 255, 0.25)'}, 
                                inset 0 0 25px ${feverLevel === 2 ? 'rgba(255, 140, 0, 0.18)' : 'rgba(255, 255, 255, 0.15)'};
                    animation: fogPulse 2.5s infinite ease-in-out;
                    pointer-events: none;
                  }
                `}</style>
                <foreignObject x="0" y="0" width="100%" height="100%">
                  <div className="fog-vignette" />
                </foreignObject>
              </g>
            )}

            {feverLevel > 0 && speedLineStyle === 'glow' && (
              <g className="glow-effects">
                <style>{`
                  @keyframes glowPulse {
                    0%, 100% {
                      opacity: ${feverLevel === 2 ? 0.4 : 0.25};
                      box-shadow: inset 0 0 15px ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 255, 255, 0.15)'}, 
                                  0 0 8px ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)'};
                    }
                    50% {
                      opacity: ${feverLevel === 2 ? 0.8 : 0.65};
                      box-shadow: inset 0 0 30px ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.35)'}, 
                                  0 0 15px ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.25)'};
                    }
                  }
                  .glow-container {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    right: 8px;
                    bottom: 8px;
                    border: 1px solid ${feverLevel === 2 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
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

            {feverLevel > 0 && speedLineStyle === 'liquid' && (
              <g className="liquid-effects">
                <defs>
                  <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop
                      offset="0%"
                      stopColor={
                        feverLevel === 2 ? 'var(--color-yellow-400)' : 'var(--color-blue-500)'
                      }
                    >
                      <animate
                        attributeName="stop-color"
                        values={
                          feverLevel === 2
                            ? 'var(--color-yellow-400); var(--color-yellow-500); var(--color-red-500); var(--color-yellow-400)'
                            : 'var(--color-blue-500); var(--color-pink-500); var(--color-orange-500); var(--color-blue-500)'
                        }
                        dur="8s"
                        repeatCount="indefinite"
                      />
                    </stop>
                    <stop
                      offset="50%"
                      stopColor={
                        feverLevel === 2 ? 'var(--color-yellow-500)' : 'var(--color-pink-500)'
                      }
                    >
                      <animate
                        attributeName="stop-color"
                        values={
                          feverLevel === 2
                            ? 'var(--color-yellow-500); var(--color-red-500); var(--color-yellow-400); var(--color-yellow-500)'
                            : 'var(--color-pink-500); var(--color-orange-500); var(--color-blue-500); var(--color-pink-500)'
                        }
                        dur="8s"
                        repeatCount="indefinite"
                      />
                    </stop>
                    <stop
                      offset="100%"
                      stopColor={
                        feverLevel === 2 ? 'var(--color-red-500)' : 'var(--color-orange-500)'
                      }
                    >
                      <animate
                        attributeName="stop-color"
                        values={
                          feverLevel === 2
                            ? 'var(--color-red-500); var(--color-yellow-400); var(--color-yellow-500); var(--color-red-500)'
                            : 'var(--color-orange-500); var(--color-blue-500); var(--color-pink-500); var(--color-orange-500)'
                        }
                        dur="8s"
                        repeatCount="indefinite"
                      />
                    </stop>
                  </linearGradient>
                </defs>
                <style>{`
                  @keyframes liquidPulse {
                    0%, 100% { 
                      filter: ${
                        feverLevel === 2
                          ? 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.7)) drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))'
                          : 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 8px rgba(236, 72, 153, 0.4))'
                      }; 
                      opacity: 0.85; 
                    }
                    50% { 
                      filter: ${
                        feverLevel === 2
                          ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.9)) drop-shadow(0 0 22px rgba(239, 68, 68, 0.7))'
                          : 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.8)) drop-shadow(0 0 18px rgba(249, 115, 22, 0.6))'
                      }; 
                      opacity: 1; 
                    }
                  }
                  .liquid-rect {
                    animation: liquidPulse 4s infinite ease-in-out;
                  }
                `}</style>
                {/* Full Screen Shifting Rainbow/Gold Gradient Background (Masked in center) */}
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#liquid-gradient)"
                  opacity={feverLevel === 2 ? 0.32 : 0.25}
                />
                {/* Outer Glowing Neon Shifting Rainbow/Gold Border */}
                <rect
                  x="1%"
                  y="1%"
                  width="98%"
                  height="98%"
                  rx="12"
                  ry="12"
                  fill="none"
                  stroke="url(#liquid-gradient)"
                  strokeWidth="4.5"
                  className="liquid-rect"
                  opacity="0.8"
                />
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
                <circle
                  cx="10%"
                  cy="-20"
                  r="2.5"
                  className="chalk-particle"
                  style={{ animationDelay: '0s', animationDuration: '3s' }}
                />
                <circle
                  cx="25%"
                  cy="-20"
                  r="1.5"
                  className="chalk-particle"
                  style={{ animationDelay: '0.5s', animationDuration: '4s' }}
                />
                <circle
                  cx="40%"
                  cy="-20"
                  r="2.0"
                  className="chalk-particle"
                  style={{ animationDelay: '1.2s', animationDuration: '3.5s' }}
                />
                <circle
                  cx="55%"
                  cy="-20"
                  r="1.8"
                  className="chalk-particle"
                  style={{ animationDelay: '0.2s', animationDuration: '2.8s' }}
                />
                <circle
                  cx="70%"
                  cy="-20"
                  r="2.2"
                  className="chalk-particle"
                  style={{ animationDelay: '1.8s', animationDuration: '4.2s' }}
                />
                <circle
                  cx="85%"
                  cy="-20"
                  r="1.2"
                  className="chalk-particle"
                  style={{ animationDelay: '0.8s', animationDuration: '3.2s' }}
                />
                <circle
                  cx="95%"
                  cy="-20"
                  r="2.0"
                  className="chalk-particle"
                  style={{ animationDelay: '2.2s', animationDuration: '3.7s' }}
                />
                <circle
                  cx="18%"
                  cy="-20"
                  r="2.5"
                  className="chalk-particle"
                  style={{ animationDelay: '2.8s', animationDuration: '3.1s' }}
                />
                <circle
                  cx="33%"
                  cy="-20"
                  r="1.5"
                  className="chalk-particle"
                  style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}
                />
                <circle
                  cx="48%"
                  cy="-20"
                  r="2.0"
                  className="chalk-particle"
                  style={{ animationDelay: '3.2s', animationDuration: '3.3s' }}
                />
                <circle
                  cx="63%"
                  cy="-20"
                  r="1.8"
                  className="chalk-particle"
                  style={{ animationDelay: '0.9s', animationDuration: '3.8s' }}
                />
                <circle
                  cx="78%"
                  cy="-20"
                  r="2.2"
                  className="chalk-particle"
                  style={{ animationDelay: '2.5s', animationDuration: '3.6s' }}
                />
              </g>
            )}

            {feverLevel > 0 && speedLineStyle === 'sweep' && (
              <g className="sweep-effects">
                <style>{`
                  @keyframes sweepFlow {
                    0% { stroke-dashoffset: 2000; }
                    100% { stroke-dashoffset: 0; }
                  }
                  .sweep-rect {
                    stroke-dasharray: 180 1200;
                    filter: ${feverLevel === 2 ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.95))' : 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))'};
                    animation: sweepFlow 3.5s infinite linear;
                  }
                `}</style>
                <rect
                  x="1%"
                  y="1%"
                  width="98%"
                  height="98%"
                  rx="12"
                  ry="12"
                  fill="none"
                  stroke={
                    feverLevel === 2 ? 'var(--color-yellow-400)' : 'rgba(255, 255, 255, 0.95)'
                  }
                  strokeWidth="3.5"
                  className="sweep-rect"
                />
              </g>
            )}

            {feverLevel > 0 && speedLineStyle === 'zen' && (
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
                    background: ${
                      feverLevel === 2
                        ? 'radial-gradient(circle, transparent 40%, rgba(255, 215, 0, 0.18) 100%)'
                        : 'transparent'
                    };
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
            letterSpacing: 'var(--spacing-nano)',
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
