import React from 'react';
import './ModeSelector.css';

interface ModeSelectorProps {
  onSelectMode: (mode: 'time-attack' | 'survival') => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="mode-selector-container">
      <h1 className="mode-title">CHOOSE YOUR CHALLENGE</h1>
      <div className="modes">
        <div
          className="mode-card time-attack"
          onClick={() => onSelectMode('time-attack')}
        >
          <h2>Time Attack</h2>
          <p>Solve as many problems as you can in 60 seconds.</p>
        </div>
        <div
          className="mode-card survival"
          onClick={() => onSelectMode('survival')}
        >
          <h2>Survival</h2>
          <p>One wrong answer and the game is over.</p>
        </div>
      </div>
    </div>
  );
}
