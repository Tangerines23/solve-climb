import React, { useEffect, useState } from 'react';
import './LinearTimer.css';

interface LinearTimerProps {
  duration: number;
  onComplete: () => void;
  isPaused: boolean;
  enableFastForward?: boolean; // Time Attack legacy support (optional)
}

export const LinearTimer: React.FC<LinearTimerProps> = ({ duration, onComplete, isPaused }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused) return;

    const interval = 100; // Update every 100ms for smoothness
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onComplete]);

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (timeLeft / duration) * 100));

  // Determine color class
  let colorClass = 'timer-green';
  if (percentage <= 20) colorClass = 'timer-red';
  else if (percentage <= 50) colorClass = 'timer-yellow';

  return (
    <div className="linear-timer-container">
      <div className={`linear-timer-bar ${colorClass}`} style={{ width: `${percentage}%` }} />
    </div>
  );
};
