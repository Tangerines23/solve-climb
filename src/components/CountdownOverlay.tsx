import { useEffect, useState } from 'react';
import './CountdownOverlay.css';
import { quizEventBus } from '@/lib/eventBus';
import { sound } from '@/utils/sound';

interface CountdownOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function CountdownOverlay({ isVisible, onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (isVisible) {
      setCount(3);
      sound.playCountdown(3);

      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            sound.playCountdown(0);
            // Give a slight delay for the "1" to be seen or "Start!"
            setTimeout(() => {
              quizEventBus.emit('QUIZ:COUNTDOWN_COMPLETE');
            }, 500);
            return 0; // or 0
          }
          const next = prev - 1;
          sound.playCountdown(next);
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="countdown-overlay">
      <div className="countdown-number">{count > 0 ? count : 'GO!'}</div>
    </div>
  );
}
