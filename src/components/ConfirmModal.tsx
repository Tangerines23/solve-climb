// 확인 모달 컴포넌트
import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger'; // danger는 삭제 등 위험한 작업용
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h2 className="confirm-modal-title">{title}</h2>
        </div>
        <div className="confirm-modal-content">
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button
            className={`confirm-modal-button confirm-modal-button-cancel`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-modal-button confirm-modal-button-confirm ${
              variant === 'danger' ? 'confirm-modal-button-danger' : ''
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

