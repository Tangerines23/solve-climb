import { ReactNode } from 'react';
import './BaseModal.css';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  showOverlay?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  showOverlay = true,
  closeOnOverlayClick = true,
  className = '',
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay animate-fade-in ${!showOverlay ? 'no-overlay' : ''}`}
      onClick={closeOnOverlayClick ? onClose : undefined}
      data-vg-ignore="true"
    >
      <div
        className={`modal-base animate-scale-in ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header-base">
            <h2 className="modal-title-base">{title}</h2>
          </div>
        )}

        <div className="modal-body-base">{children}</div>

        {actions && <div className="modal-footer-base">{actions}</div>}
      </div>
    </div>
  );
}
