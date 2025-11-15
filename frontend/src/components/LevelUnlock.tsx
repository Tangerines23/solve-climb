import React from 'react';
import './LevelUnlock.css';

interface LevelUnlockProps {
  clearedLevel: number;
  onNextLevel: () => void;
}

export function LevelUnlock({ clearedLevel, onNextLevel }: LevelUnlockProps) {
  return (
    <div className="level-unlock-overlay">
      <div className="level-unlock-modal">
        <h2>Level {clearedLevel} Cleared!</h2>
        <p>You've unlocked Level {clearedLevel + 1}.</p>
        <div className="level-path">
          <div className="level-node completed">{clearedLevel}</div>
          <div className="level-connector"></div>
          <div className="level-node unlocked">{clearedLevel + 1}</div>
        </div>
        <button onClick={onNextLevel} className="next-level-button">
          Continue
        </button>
      </div>
    </div>
  );
}
