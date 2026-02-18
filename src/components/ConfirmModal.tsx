import { BaseModal } from './BaseModal';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'primary',
}: ConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      actions={
        <>
          <button
            className="btn-base btn-secondary confirm-modal-button cancel-button"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn-base ${variant === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-modal-button confirm-button`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="confirm-modal-message">{message}</p>
    </BaseModal>
  );
}
