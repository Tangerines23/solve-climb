// 알림 모달 컴포넌트
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
  if (!isOpen) return null;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-modal-header">
          <h2 className="alert-modal-title">{title}</h2>
        </div>
        <div className="alert-modal-content">
          <p className="alert-modal-message">{message}</p>
        </div>
        <div className="alert-modal-actions">
          <button className="alert-modal-button" onClick={onClose}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
