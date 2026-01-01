// 범용 토스트 메시지 컴포넌트
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: string;
}

export function Toast({
  message,
  isOpen,
  onClose,
  autoClose = true,
  autoCloseDelay = 2000,
  icon,
}: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldWrap, setShouldWrap] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 텍스트 너비 측정하여 줄바꿈 필요 여부 결정
  useEffect(() => {
    if (!isOpen || !message) {
      setShouldWrap(false);
      return;
    }

    // 렌더링 완료 후 측정
    const measureTimeout = setTimeout(() => {
      if (!textRef.current || !contentRef.current) return;

      // 임시로 한 줄로 표시하여 실제 너비 측정
      const textElement = textRef.current;

      const originalWhiteSpace = textElement.style.whiteSpace;
      textElement.style.whiteSpace = 'nowrap';

      const textWidth = textElement.scrollWidth;
      const iconWidth = icon ? 28 : 0; // 아이콘(20px) + gap(8px)
      const padding = 40; // 좌우 padding (20px * 2)
      const maxContentWidth = Math.min(400, window.innerWidth - 16);
      const availableWidth = maxContentWidth - padding - iconWidth;

      textElement.style.whiteSpace = originalWhiteSpace;

      // 텍스트 너비가 사용 가능한 너비를 초과하면 줄바꿈 허용
      setShouldWrap(textWidth > availableWidth);
    }, 10);

    return () => clearTimeout(measureTimeout);
  }, [isOpen, message, icon]);

  useEffect(() => {
    // 타이머 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen && message) {
      setIsClosing(false);

      // 자동 닫기
      if (autoClose && onClose) {
        timerRef.current = setTimeout(() => {
          setIsClosing(true);
          timerRef.current = setTimeout(() => {
            onClose();
            setIsClosing(false);
          }, 300);
        }, autoCloseDelay);
      }
    } else if (!isOpen) {
      setIsClosing(true);
      timerRef.current = setTimeout(() => {
        setIsClosing(false);
      }, 300);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, message, autoClose, autoCloseDelay, onClose]);

  if (!isOpen || !message) return null;

  return createPortal(
    <div className={`toast ${isClosing ? 'closing' : ''}`}>
      <div ref={contentRef} className="toast-content">
        {icon && <span className="toast-icon">{icon}</span>}
        <span ref={textRef} className={`toast-text ${shouldWrap ? 'wrap' : 'nowrap'}`}>
          {message}
        </span>
      </div>
    </div>,
    document.body
  );
}
