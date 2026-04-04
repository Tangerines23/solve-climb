import { useEffect, useState, useRef } from 'react';

/**
 * Hook to animate a count from 0 to targetValue with easing.
 */
export function useCountUp(targetValue: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (targetValue === 0) {
      setCount(0);
      return;
    }
    startTimeRef.current = Date.now();
    let rid: number;
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current!;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(targetValue * eased));

      if (progress < 1) {
        rid = requestAnimationFrame(animate);
      } else {
        setCount(targetValue);
      }
    };
    rid = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rid);
  }, [targetValue, duration]);

  return count;
}
