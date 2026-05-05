import React, { useState } from 'react';
import './CoordinateGrid.css';

interface CoordinateGridProps {
  onShoot: (x: number, y: number) => void;
  range?: number; // Distance from center, e.g., 5 means -5 to 5
  isFirstQuadrantOnly?: boolean;
  disabled?: boolean;
}

export const CoordinateGrid: React.FC<CoordinateGridProps> = ({
  onShoot,
  range = 5,
  isFirstQuadrantOnly = false,
  disabled = false,
}) => {
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (x: number, y: number) => {
    if (disabled) return;
    setSelected({ x, y });
    onShoot(x, y);
  };

  const renderGrid = () => {
    const cells = [];
    const min = isFirstQuadrantOnly ? 0 : -range;
    const max = range;

    for (let y = max; y >= min; y--) {
      const row = [];
      for (let x = min; x <= max; x++) {
        const isSelected = selected?.x === x && selected?.y === y;
        const isOrigin = x === 0 && y === 0;
        const isAxis = x === 0 || y === 0;

        row.push(
          <div
            key={`${x}-${y}`}
            className={`grid-cell ${isOrigin ? 'origin' : ''} ${isAxis ? 'axis' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => handleClick(x, y)}
          >
            {isSelected && <div className="crosshair" />}
            {/* Show labels for axes sparingly */}
            {isAxis && (x === max || y === max || x === min || y === min) && (
              <span className="axis-label">{x === 0 ? y : x}</span>
            )}
          </div>
        );
      }
      cells.push(
        <div key={`row-${y}`} className="grid-row">
          {row}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className={`coordinate-grid-container ${disabled ? 'disabled' : ''}`}>
      <div className="grid-labels">
        <span className="y-axis-label">Y</span>
        <div className="grid-box">{renderGrid()}</div>
        <span className="x-axis-label">X</span>
      </div>
      <div className="coordinate-display">
        {selected ? `선택된 좌표: (${selected.x}, ${selected.y})` : '목표를 조준하세요!'}
      </div>
    </div>
  );
};
