import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  initialTime: number;
  onGameOver: () => void;
  isPaused: boolean;
}

export function Timer({ initialTime, onGameOver, isPaused }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    if (timeLeft <= 0) {
      onGameOver();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onGameOver, isPaused]);

  const progress = (timeLeft / initialTime) * 100;

  return (
    <div className="timer-container">
      <div className="timer-bar" style={{ width: `${progress}%` }}></div>
      <span className="timer-text">{timeLeft}s</span>
    </div>
  );
}
