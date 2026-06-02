import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDebugStore } from '../stores/useDebugStore';
import './TimerCircle.css';

interface TimerCircleProps {
  duration: number;
  onComplete: () => void;
  isPaused?: boolean;
  enableFastForward?: boolean;
  triggerPenalty?: number;
  penaltyAmount?: number;
}

function TimerCircleComponent({
  duration,
  onComplete,
  isPaused = false,
  enableFastForward = false,
  triggerPenalty = 0,
  penaltyAmount = 5,
}: TimerCircleProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isFastForward, setIsFastForward] = useState(false);
  const [isStoppedByClick, setIsStoppedByClick] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // onComplete 콜백을 ref로 저장하여 최신 값 유지
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // duration이 변경되면 timeLeft 리셋 및 정지 상태 초기화
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(duration);
    setIsStoppedByClick(false);
  }, [duration]);

  // 패널티 발생 시 시간 차감
  useEffect(() => {
    if (triggerPenalty && triggerPenalty > 0) {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - penaltyAmount);
        if (next === 0) {
          setTimeout(() => onCompleteRef.current(), 0);
        }
        return next;
      });
    }
  }, [triggerPenalty, penaltyAmount]);

  // 길게 누르기 핸들러 메모이제이션 (dev 모드 전용)
  const handleMouseDown = useCallback(() => {
    const isAdmin = useDebugStore.getState().isAdminMode;
    if (!isAdmin || !enableFastForward || isPaused) return;
    pressTimerRef.current = setTimeout(() => setIsFastForward(true), 500);
  }, [enableFastForward, isPaused]);

  const handleMouseUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsFastForward(false);
  }, []);

  const handleTimerClick = useCallback(() => {
    const isAdmin = useDebugStore.getState().isAdminMode;
    if (!isAdmin) return;
    setIsStoppedByClick((prev) => !prev);
  }, []);

  // 타이머 로직
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPaused || (useDebugStore.getState().isAdminMode && isStoppedByClick)) return;

    if (timeLeft <= 0 && duration > 0) {
      onCompleteRef.current();
      return;
    }

    const interval = isFastForward ? 50 : 1000;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // ref를 통해 최신 콜백 호출
          setTimeout(() => onCompleteRef.current(), 0);
          return 0;
        }
        return newTime;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, isStoppedByClick, isFastForward, duration, timeLeft]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // 스타일 계산 메모이제이션
  const { circleStyle, timeLabel } = useMemo(() => {
    const pct = Math.max(0, Math.min(1, timeLeft / duration));
    const ang = 360 * pct;

    // v2.2 Ring Color Logic (Green -> Yellow -> Red)
    let ringColor = 'var(--color-success)'; // Default Green (TDS Teal)
    if (pct < 0.25) {
      ringColor = 'var(--color-error)'; // Red
    } else if (pct < 0.5) {
      ringColor = 'var(--color-warning)'; // Yellow
    }

    return {
      percentage: pct,
      angle: ang,
      circleStyle: {
        background: `conic-gradient(${ringColor} ${ang}deg, var(--color-bg-tertiary) 0deg)`,
        borderRadius: '50%',
        width: '28px',
        height: '28px',
      },
      timeLabel: `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`,
    };
  }, [timeLeft, duration]);

  const eventHandlers = useMemo(() => {
    const isAdmin = useDebugStore.getState().isAdminMode;
    if (!isAdmin || !enableFastForward) return {};
    return {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleMouseDown,
      onTouchEnd: handleMouseUp,
      style: { cursor: 'pointer' as const },
    };
  }, [enableFastForward, handleMouseDown, handleMouseUp]);

  return (
    <div
      className="timer-circle-container"
      {...eventHandlers}
      onClick={handleTimerClick}
      style={{
        ...eventHandlers.style,
        opacity: (useDebugStore.getState().isAdminMode && isStoppedByClick) ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div style={circleStyle}></div>
      <div className="timer-label">{timeLabel}</div>
    </div>
  );
}

export const TimerCircle = React.memo(TimerCircleComponent);
