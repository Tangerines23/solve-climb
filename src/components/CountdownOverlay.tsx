import { useEffect, useState } from 'react';
import './CountdownOverlay.css';

interface CountdownOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function CountdownOverlay({ isVisible, onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (isVisible) {
      setCount(3);
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Give a slight delay for the "1" to be seen or "Start!"
            setTimeout(() => {
              onComplete();
            }, 500);
            return 0; // or 0
          }
          return prev - 1;
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
