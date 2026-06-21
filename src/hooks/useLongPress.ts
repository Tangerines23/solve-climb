import React, { useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onMediumPress?: () => void; // 2초 등의 중간 피드백
  mediumDelay?: number;
  longDelay?: number;
  disabled?: boolean;
}

export function useLongPress({
  onLongPress,
  onMediumPress,
  mediumDelay = 2000,
  longDelay = 4000,
  disabled = false,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediumTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.stopPropagation();

    // Clean up any existing timers
    stop();

    if (onMediumPress) {
      mediumTimerRef.current = setTimeout(() => {
        onMediumPress();
      }, mediumDelay);
    }

    timerRef.current = setTimeout(() => {
      onLongPress();
      if (mediumTimerRef.current) {
        clearTimeout(mediumTimerRef.current);
        mediumTimerRef.current = null;
      }
    }, longDelay);
  };

  const stop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (mediumTimerRef.current) {
      clearTimeout(mediumTimerRef.current);
      mediumTimerRef.current = null;
    }
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
}
