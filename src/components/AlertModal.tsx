import { BaseModal } from './BaseModal';
import './AlertModal.css';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export function AlertModal({
  isOpen,
  title,
  message,
  buttonText = '확인',
  onClose,
}: AlertModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <button className="btn-base btn-primary alert-modal-button" onClick={onClose}>
          {buttonText}
        </button>
      }
    >
      <p className="alert-modal-message">{message}</p>
    </BaseModal>
  );
}
