import React from 'react';
import './GeometryTipVisualizer.css';
import { ManimLevel1Visualizer } from './ManimLevel1Visualizer';
import { ManimLevel2Visualizer } from './ManimLevel2Visualizer';
import { ManimLevel3Visualizer } from './ManimLevel3Visualizer';
import { ManimLevel4Visualizer } from './ManimLevel4Visualizer';
import { ManimLevel5Visualizer } from './ManimLevel5Visualizer';
import { ManimLevel6Visualizer } from './ManimLevel6Visualizer';

interface GeometryTipVisualizerProps {
  level: number;
}

export const GeometryTipVisualizer: React.FC<GeometryTipVisualizerProps> = ({ level }) => {
  const size = 200;
  const center = size / 2;

  const renderVisualizer = () => {
    switch (level) {
      case 1:
        return <ManimLevel1Visualizer />;

      case 2: {
        // 2-2: 대칭축 기초 (정다각형의 선대칭)
        const sides = 5;
        const radius = 55;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < sides; i++) {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
          pts.push({
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
          });
        }
        const ptsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points={ptsStr} className="geo-shape-poly" />
            {/* 5 Symmetry Lines */}
            {pts.map((p, idx) => {
              const oppX = center + (center - p.x) * 0.8;
              const oppY = center + (center - p.y) * 0.8;
              return (
                <line
                  key={idx}
                  x1={p.x}
                  y1={p.y}
                  x2={oppX}
                  y2={oppY}
                  className="geo-symmetry-line"
                  style={{ animationDelay: `${idx * 0.3}s` }}
                />
              );
            })}
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              정n각형의 선대칭축 수 = n개
            </text>
          </svg>
        );
      }

      case 3:
        return <ManimLevel3Visualizer />;

      case 4:
        return <ManimLevel4Visualizer />;

      case 5:
        return <ManimLevel5Visualizer />;

      case 6:
        return <ManimLevel6Visualizer />;

      case 7: {
        // 2-7: 사다리꼴 넓이 ((윗변 + 아랫변) × 높이 / 2)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="60,60 140,60 165,130 35,130" className="geo-shape-poly" />
            <line x1="60" y1="60" x2="60" y2="130" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="100" y="52" className="geo-dim-text">윗변(a)</text>
            <text x="100" y="146" className="geo-dim-text">아랫변(b)</text>
            <text x="45" y="98" className="geo-dim-text">높이(h)</text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              넓이 = (윗변 + 아랫변) × 높이 / 2
            </text>
          </svg>
        );
      }

      case 8: {
        // 2-8: 원의 기초 (반지름과 지름)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <circle cx={center} cy={90} r="55" className="geo-circle-poly" />
            <circle cx={center} cy={90} r="4" className="geo-center-dot" />
            <line x1={center} y1={90} x2={center + 55} y2={90} className="geo-radius-line" />
            <text x={center + 25} y={83} className="geo-dim-text">
              반지름(r)
            </text>
            <line
              x1={center - 55}
              y1={115}
              x2={center + 55}
              y2={115}
              className="geo-diameter-line"
            />
            <text x={center} y={130} className="geo-dim-text">
              지름(d = 2r)
            </text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              지름 = 반지름 × 2
            </text>
          </svg>
        );
      }

      case 9: {
        // 2-9: 원의 둘레 (원주율 = 3.1)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <circle cx={center} cy={85} r="55" className="geo-circle-perimeter-animated" />
            <line x1={center} y1={85} x2={center + 55} y2={85} className="geo-radius-line" />
            <text x={center + 25} y={78} className="geo-dim-text">r = 10</text>
            <text x={center} y={105} className="geo-circle-subtext">
              둘레 = 2 × 3.1 × r
            </text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              r=10일 때 둘레 = 62
            </text>
          </svg>
        );
      }

      case 10: {
        // 2-10: 원의 넓이 (원주율 = 3.1)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <circle cx={center} cy={85} r="55" className="geo-circle-fill-animated" />
            <text x={center} y={82} className="geo-circle-text">
              원주율 π ≈ 3.1
            </text>
            <text x={center} y={105} className="geo-circle-subtext">
              넓이 = 3.1 × r²
            </text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              r=10일 때 넓이 = 310
            </text>
          </svg>
        );
      }

      case 11: {
        // 2-11: 다각형 대각선 (대각선 개수)
        const sides = 5;
        const radius = 55;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < sides; i++) {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
          pts.push({
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
          });
        }
        const ptsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points={ptsStr} className="geo-shape-poly" />
            {/* 5 Diagonals for Pentagon */}
            <line x1={pts[0]!.x} y1={pts[0]!.y} x2={pts[2]!.x} y2={pts[2]!.y} className="geo-radius-line" />
            <line x1={pts[0]!.x} y1={pts[0]!.y} x2={pts[3]!.x} y2={pts[3]!.y} className="geo-radius-line" />
            <line x1={pts[1]!.x} y1={pts[1]!.y} x2={pts[3]!.x} y2={pts[3]!.y} className="geo-radius-line" />
            <line x1={pts[1]!.x} y1={pts[1]!.y} x2={pts[4]!.x} y2={pts[4]!.y} className="geo-radius-line" />
            <line x1={pts[2]!.x} y1={pts[2]!.y} x2={pts[4]!.x} y2={pts[4]!.y} className="geo-radius-line" />
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              대각선 수 = n(n-3)/2 (오각형: 5개)
            </text>
          </svg>
        );
      }

      case 12: {
        // 2-12: 입체도형 기본 (각기둥/각뿔 꼭짓점, 모서리)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="50,60 110,35 150,60" className="geo-wire-top" />
            <polygon points="50,130 110,105 150,130" className="geo-wire-bottom" />
            <line x1="50" y1="60" x2="50" y2="130" className="geo-wire-edge" />
            <line x1="110" y1="35" x2="110" y2="105" className="geo-wire-edge-dash" />
            <line x1="150" y1="60" x2="150" y2="130" className="geo-wire-edge" />
            <circle cx="50" cy="60" r="5" className="geo-wire-dot" />
            <circle cx="110" cy="35" r="5" className="geo-wire-dot" />
            <circle cx="150" cy="60" r="5" className="geo-wire-dot" />
            <circle cx="50" cy="130" r="5" className="geo-wire-dot" />
            <circle cx="110" cy="105" r="5" className="geo-wire-dot" />
            <circle cx="150" cy="130" r="5" className="geo-wire-dot" />
            <text x={center} y={size - 10} className="geo-tip-subtext">
              n각기둥: 모서리 3n개 / n각뿔: 꼭짓점 n+1개
            </text>
          </svg>
        );
      }

      case 13: {
        // 2-13: 직육면체 부피 (가로 × 세로 × 높이)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="100,40 150,65 100,90 50,65" className="geo-cube-face face-top" />
            <polygon points="50,65 100,90 100,140 50,115" className="geo-cube-face face-left" />
            <polygon points="100,90 150,65 150,115 100,140" className="geo-cube-face face-right" />
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              부피 = 가로 × 세로 × 높이
            </text>
          </svg>
        );
      }

      case 14: {
        // 2-14: 피타고라스 맛보기 (3:4:5 직각삼각형)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="40,140 160,140 40,50" className="geo-pythagoras-poly" />
            <rect x="40" y="125" width="15" height="15" className="geo-right-angle-box" />
            <text x="95" y="156" className="geo-dim-text">
              밑변 3
            </text>
            <text x="25" y="100" className="geo-dim-text">
              높이 4
            </text>
            <text x="110" y="90" className="geo-hypotenuse-text">
              빗변 5 (3² + 4² = 5²)
            </text>
            <text x={center} y={size - 8} className="geo-tip-subtext-highlight">
              비율: 3 : 4 : 5
            </text>
          </svg>
        );
      }

      case 15: {
        // 2-15: 삼각비 맛보기 (tan(45°) = 1, sin(30°) = 1/2)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="40,135 150,135 150,25" className="geo-pythagoras-poly" />
            <rect x="135" y="120" width="15" height="15" className="geo-right-angle-box" />
            <text x="45" y="125" fill="#4ADE80" fontSize="13" fontWeight="bold">45°</text>
            <text x="95" y="150" className="geo-dim-text">밑변 = 1</text>
            <text x="155" y="85" className="geo-dim-text">높이 = 1</text>
            <text x={center} y={size - 8} className="geo-tip-subtext-highlight">
              tan(45°) = 높이/밑변 = 1
            </text>
          </svg>
        );
      }

      default:
        return null;
    }
  };

  return <div className="geometry-tip-visualizer-container">{renderVisualizer()}</div>;
};
