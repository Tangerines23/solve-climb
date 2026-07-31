import React from 'react';
import './GeometryTipVisualizer.css';

interface GeometryTipVisualizerProps {
  level: number;
}

export const GeometryTipVisualizer: React.FC<GeometryTipVisualizerProps> = ({ level }) => {
  const size = 200;
  const center = size / 2;

  const renderVisualizer = () => {
    switch (level) {
      case 1: {
        // 2-1: 기초 도형 (꼭짓점과 변) - 오각형 꼭짓점 펄스
        const sides = 5;
        const radius = 60;
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
            {pts.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="8" className="geo-vertex-pulse" />
                <circle cx={p.x} cy={p.y} r="5" className="geo-vertex-dot" />
              </g>
            ))}
            <text x={center} y={size - 10} className="geo-tip-subtext">
              꼭짓점 5개 / 변 5개
            </text>
          </svg>
        );
      }

      case 2: {
        // 2-2: 다각형 대각선 - 오각형 대각선 순차 애니메이션
        const sides = 5;
        const radius = 60;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < sides; i++) {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
          pts.push({
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
          });
        }
        const ptsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

        // Diagonals (non-adjacent vertices)
        const diagonals: { x1: number; y1: number; x2: number; y2: number }[] = [];
        for (let i = 0; i < sides; i++) {
          for (let j = i + 2; j < sides; j++) {
            if (i === 0 && j === sides - 1) continue;
            diagonals.push({ x1: pts[i]!.x, y1: pts[i]!.y, x2: pts[j]!.x, y2: pts[j]!.y });
          }
        }

        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points={ptsStr} className="geo-shape-poly-light" />
            {diagonals.map((d, idx) => (
              <line
                key={idx}
                x1={d.x1}
                y1={d.y1}
                x2={d.x2}
                y2={d.y2}
                className="geo-diagonal-line"
                style={{ animationDelay: `${idx * 0.25}s` }}
              />
            ))}
            {pts.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="4" className="geo-vertex-dot" />
            ))}
            <text x={center} y={size - 10} className="geo-tip-subtext">
              대각선 총 5개: n(n-3)/2
            </text>
          </svg>
        );
      }

      case 3: {
        // 2-3: 삼각형의 성질 (내각의 합 180도)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="100,30 35,145 165,145" className="geo-shape-poly" />
            {/* Inner Angle Arcs */}
            <path d="M 100,30 L 90,50 A 25 25 0 0 0 110,50 Z" className="geo-angle-arc arc-1" />
            <path d="M 35,145 L 60,145 A 25 25 0 0 0 47,123 Z" className="geo-angle-arc arc-2" />
            <path d="M 165,145 L 153,123 A 25 25 0 0 0 140,145 Z" className="geo-angle-arc arc-3" />
            <text x={100} y={75} className="geo-angle-label">
              α
            </text>
            <text x={65} y={135} className="geo-angle-label">
              β
            </text>
            <text x={135} y={135} className="geo-angle-label">
              γ
            </text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              α + β + γ = 180°
            </text>
          </svg>
        );
      }

      case 4: {
        // 2-4: 사각형의 성질 (평행사변형 각도)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="65,40 165,40 135,140 35,140" className="geo-shape-poly" />
            {/* Opposite angles (A & C) equal, Adjacent angles (A & B) sum 180 */}
            <circle cx="65" cy="40" r="7" className="geo-angle-highlight-1" />
            <circle cx="135" cy="140" r="7" className="geo-angle-highlight-1" />
            <circle cx="165" cy="40" r="7" className="geo-angle-highlight-2" />
            <circle cx="35" cy="140" r="7" className="geo-angle-highlight-2" />
            <text x={center} y={size - 10} className="geo-tip-subtext">
              마주보는 각 동일 / 이웃한 각 합 = 180°
            </text>
          </svg>
        );
      }

      case 5: {
        // 2-5: 직사각형 넓이 (가로 x 세로)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <rect x="35" y="45" width="130" height="90" className="geo-rect-animated" />
            {/* Width and Height Labels */}
            <line x1="35" y1="35" x2="165" y2="35" className="geo-dim-line" />
            <text x="100" y="28" className="geo-dim-text">
              가로 (Width)
            </text>
            <line x1="175" y1="45" x2="175" y2="135" className="geo-dim-line" />
            <text x="180" y="94" className="geo-dim-text-vert">
              세로
            </text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              넓이 = 가로 × 세로
            </text>
          </svg>
        );
      }

      case 6: {
        // 2-6: 삼각형 넓이 (밑변 x 높이 / 2)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="110,40 30,140 170,140" className="geo-shape-poly" />
            {/* Height Line (dashed) */}
            <line x1="110" y1="40" x2="110" y2="140" className="geo-height-line" />
            <rect x="110" y="130" width="10" height="10" className="geo-right-angle-box" />
            <text x="122" y="90" className="geo-dim-text">
              높이(h)
            </text>
            <line x1="30" y1="152" x2="170" y2="152" className="geo-dim-line" />
            <text x="100" y="165" className="geo-dim-text">
              밑변(b)
            </text>
            <text x={center} y={size - 8} className="geo-tip-subtext-highlight">
              넓이 = (밑변 × 높이) ÷ 2
            </text>
          </svg>
        );
      }

      case 7: {
        // 2-7: 원의 기초 (반지름과 지름)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <circle cx={center} cy={90} r="55" className="geo-circle-poly" />
            <circle cx={center} cy={90} r="4" className="geo-center-dot" />
            {/* Radius & Diameter Lines */}
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

      case 8: {
        // 2-8: 원의 둘레와 넓이 (원주율 = 3.1)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <circle cx={center} cy={85} r="55" className="geo-circle-fill-animated" />
            <circle cx={center} cy={85} r="55" className="geo-circle-perimeter-animated" />
            <text x={center} y={82} className="geo-circle-text">
              원주율 π ≈ 3.1
            </text>
            <text x={center} y={102} className="geo-circle-subtext">
              둘레: 2 × 3.1 × r
            </text>
            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              넓이: 3.1 × r²
            </text>
          </svg>
        );
      }

      case 9: {
        // 2-9: 대칭축 기초 (정다각형의 선대칭)
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

      case 10: {
        // 2-10: 피타고라스 기초 (3:4:5 직각삼각형)
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

      case 11: {
        // 2-11: 피타고라스 심화 (7:24:25 확장)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            <polygon points="35,140 175,140 35,45" className="geo-pythagoras-poly-adv" />
            <rect x="35" y="125" width="15" height="15" className="geo-right-angle-box" />
            <text x="100" y="156" className="geo-dim-text">
              a = 7
            </text>
            <text x="20" y="95" className="geo-dim-text">
              b = 24
            </text>
            <text x="115" y="85" className="geo-hypotenuse-text">
              c = 25
            </text>
            <text x={center} y={size - 8} className="geo-tip-subtext-highlight">
              a² + b² = c² (7:24:25, 5:12:13)
            </text>
          </svg>
        );
      }

      case 12: {
        // 2-12: 입체도형 기본 (3D 각기둥/각뿔 꼭짓점, 모서리)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            {/* Isometric Triangular Prism Wireframe */}
            <polygon points="50,60 110,35 150,60" className="geo-wire-top" />
            <polygon points="50,130 110,105 150,130" className="geo-wire-bottom" />
            <line x1="50" y1="60" x2="50" y2="130" className="geo-wire-edge" />
            <line x1="110" y1="35" x2="110" y2="105" className="geo-wire-edge-dash" />
            <line x1="150" y1="60" x2="150" y2="130" className="geo-wire-edge" />

            {/* Glowing vertices */}
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
        // 2-13: 입체도형 부피 (직육면체 & 원기둥)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            {/* Cylinder Volume fill animation */}
            <ellipse cx={center} cy="50" rx="45" ry="16" className="geo-cylinder-top" />
            <path
              d="M 55,50 L 55,120 A 45 16 0 0 0 145,120 L 145,50 Z"
              className="geo-cylinder-body"
            />
            <ellipse cx={center} cy="120" rx="45" ry="16" className="geo-cylinder-bottom" />

            {/* Volume Rise Line */}
            <line x1="152" y1="50" x2="152" y2="120" className="geo-dim-line" />
            <text x="162" y="90" className="geo-dim-text-vert">
              높이(h)
            </text>

            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              부피 = 밑넓이(B) × 높이(h)
            </text>
          </svg>
        );
      }

      case 14: {
        // 2-14: 입체도형 겉넓이 (정육면체 겉넓이)
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="geo-tip-svg">
            {/* Cube Isometric Faces highlight */}
            <polygon points="100,30 150,55 100,80 50,55" className="geo-cube-face face-top" />
            <polygon points="50,55 100,80 100,140 50,115" className="geo-cube-face face-left" />
            <polygon points="100,80 150,55 150,115 100,140" className="geo-cube-face face-right" />

            <text x={center} y={size - 10} className="geo-tip-subtext-highlight">
              겉넓이 = 면 6개 × 한 면 넓이 (6 × s²)
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
