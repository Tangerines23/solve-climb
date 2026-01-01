import { useEffect, useState } from 'react';
import './UnderDevelopmentModal.css';

interface UnderDevelopmentModalProps {
  isOpen: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function UnderDevelopmentModal({
  isOpen,
  onClose,
  autoClose = true,
  autoCloseDelay = 2000,
}: UnderDevelopmentModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && autoClose && onClose) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          setIsClosing(false);
        }, 300); // 페이드 아웃 애니메이션 시간
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`under-development-toast ${isClosing ? 'closing' : ''}`}>
      <div className="under-development-toast-content">
        <span className="under-development-toast-icon">🚧</span>
        <span className="under-development-toast-text">아직 개발중입니다 :(</span>
      </div>
    </div>
  );
}
