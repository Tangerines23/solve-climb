import React from 'react';
import './GeometryTipVisualizer.css';

interface ManimCardLayoutProps {
  badgeName: string;
  isPaused: boolean;
  onTogglePause: () => void;
  children: React.ReactNode;
  captionContent: React.ReactNode;
}

export const ManimCardLayout: React.FC<ManimCardLayoutProps> = React.memo(
  ({ badgeName, isPaused, onTogglePause, children, captionContent }) => {
    return (
      <div
        className="geo-level1-wrapper"
        onClick={onTogglePause}
        style={{ cursor: 'pointer', position: 'relative' }}
        title={isPaused ? '클릭/터치하여 애니메이션 재개' : '클릭/터치하여 애니메이션 일시정지'}
      >
        {isPaused && (
          <div className="geo-pause-overlay">
            <span>⏸ 일시정지됨 (터치하여 계속)</span>
          </div>
        )}

        {/* Top Left Badge: Polygon/Concept Name (Purple Pill Badge) Tightly Aligned to Top-Left Corner */}
        <div style={{ position: 'absolute', top: 2, left: 2, zIndex: 10 }}>
          <span className="geo-shape-badge">
            <span key={badgeName} className="geo-text-mode-1">
              {badgeName}
            </span>
          </span>
        </div>

        {/* SVG Drawing Canvas */}
        {children}

        {/* Dynamic 3B1B Pure Formula Caption Box */}
        <div className="geo-level1-caption-box" style={{ justifyContent: 'center' }}>
          {captionContent}
        </div>
      </div>
    );
  }
);
