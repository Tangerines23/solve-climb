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
  children?: React.ReactNode;
}

export function Toast({
  message,
  isOpen,
  onClose,
  autoClose = true,
  autoCloseDelay = 2000,
  icon,
  children,
}: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
        <span ref={textRef} className="toast-text">
          {message}
        </span>
        {children}
      </div>
    </div>,
    document.body
  );
}
