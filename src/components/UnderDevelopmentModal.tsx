import { useEffect } from 'react';
import { BaseModal } from './BaseModal';
import './UnderDevelopmentModal.css';

interface UnderDevelopmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function UnderDevelopmentModal({
  isOpen,
  onClose,
  autoClose = true,
  autoCloseDelay = 2000,
}: UnderDevelopmentModalProps) {
  useEffect(() => {
    if (isOpen && autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="under-development-modal">
      <div className="under-development-modal-content">
        <span className="under-development-modal-icon">🚧</span>
        <span className="under-development-modal-text">아직 개발중입니다 :(</span>
      </div>
    </BaseModal>
  );
}
