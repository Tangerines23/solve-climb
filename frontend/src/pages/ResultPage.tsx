// src/pages/ResultPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import './ResultPage.css';

export function ResultPage() {
  const { score, level } = useQuizStore();
  const navigate = useNavigate();

  const handlePlayAgain = () => {
    navigate('/'); // Navigate back to the main quiz page
  };

  // Placeholder for level up logic
  const didLevelUp = score > (level * 100) * 1.5; // Example logic

  return (
    <div className="page-container">
      <div className="result-card">
        <h1 className="result-title">Quiz Complete!</h1>
        
        <div className="score-section">
          <p className="score-label">Your Score</p>
          <p className="score-value">{score}</p>
        </div>

        {didLevelUp && (
          <div className="level-up-section">
            <p className="level-up-text">🎉 Level Up! 🎉</p>
            <p className="level-value">You've reached Level {level + 1}!</p>
          </div>
        )}

        <button onClick={handlePlayAgain} className="submit-button">
          Try Again
        </button>
      </div>
    </div>
  );
}
