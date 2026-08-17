import { useEffect, useState } from 'react';
import './CountdownOverlay.css';
import { quizEventBus } from '@/lib/eventBus';
import { sound, bgm } from '@/utils/sound';

interface CountdownOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function CountdownOverlay({ isVisible, onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (isVisible) {
      setCount(3);
      bgm.stop(0.1); // 카운트다운 중에는 무음 유지
      sound.playCountdown(3);

      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            sound.playCountdown(0);
            bgm.play('celeste'); // GO! 소리와 함께 인게임 BGM 시작
            // Give a slight delay for the "1" to be seen or "Start!"
            setTimeout(() => {
              quizEventBus.emit('QUIZ:COUNTDOWN_COMPLETE');
            }, 500);
            return 0;
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
