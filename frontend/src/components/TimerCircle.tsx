import React, { useEffect, useState } from 'react';
import './TimerCircle.css';

interface TimerCircleProps {
  duration: number;
  onComplete: () => void;
  isPaused?: boolean;
}

export function TimerCircle({ duration, onComplete, isPaused = false }: TimerCircleProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (timeLeft <= 0) onComplete();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isPaused, onComplete]);

  const percentage = timeLeft / duration;
  const angle = 360 * percentage;

  const circleStyle = {
    background: `conic-gradient(#3182f6 ${angle}deg, #2c2c2c 0deg)`,
    borderRadius: '50%',
    width: '28px',
    height: '28px',
  };

  return (
    <div className="timer-circle-container">
      <div style={circleStyle}></div>
      <div className="timer-label">{timeLeft}초</div>
    </div>
  );
}