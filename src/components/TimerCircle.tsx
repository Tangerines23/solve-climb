import React, { useEffect, useState, useRef } from 'react';
import './TimerCircle.css';

interface TimerCircleProps {
  duration: number;
  onComplete: () => void;
  isPaused?: boolean;
  enableFastForward?: boolean; // 타임어택 모드에서 빠른 진행 활성화
}

export function TimerCircle({ duration, onComplete, isPaused = false, enableFastForward = false }: TimerCircleProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isFastForward, setIsFastForward] = useState(false);
  const pressStartTimeRef = useRef<number | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // duration이 변경되면 timeLeft를 초기화
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  // 길게 누르기 감지 (3초)
  const handleMouseDown = () => {
    if (!enableFastForward || isPaused) return;
    
    pressStartTimeRef.current = Date.now();
    pressTimerRef.current = setTimeout(() => {
      setIsFastForward(true);
    }, 3000); // 3초
  };

  const handleMouseUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsFastForward(false);
    pressStartTimeRef.current = null;
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (timeLeft <= 0) onComplete();
      return;
    }
    
    // 빠른 진행 모드: 100ms마다 1초씩 감소 (10배 빠름)
    const interval = isFastForward ? 100 : 1000;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), interval);
    return () => clearTimeout(timer);
  }, [timeLeft, isPaused, onComplete, isFastForward]);

  const percentage = timeLeft / duration;
  const angle = 360 * percentage;

  const circleStyle = {
    background: `conic-gradient(#00BFA5 ${angle}deg, #2c2c2c 0deg)`,
    borderRadius: '50%',
    width: '28px',
    height: '28px',
  };

  return (
    <div 
      className="timer-circle-container"
      onMouseDown={enableFastForward ? handleMouseDown : undefined}
      onMouseUp={enableFastForward ? handleMouseUp : undefined}
      onMouseLeave={enableFastForward ? handleMouseLeave : undefined}
      onTouchStart={enableFastForward ? handleMouseDown : undefined}
      onTouchEnd={enableFastForward ? handleMouseUp : undefined}
      style={{ cursor: enableFastForward ? 'pointer' : 'default' }}
    >
      <div style={circleStyle}></div>
      <div className="timer-label">
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
}