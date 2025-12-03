// 레벨/기록 리셋 확인 모달
import React from 'react';
import './ResetConfirmModal.css';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: ResetConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="reset-confirm-modal-overlay" onClick={onCancel}>
      <div className="reset-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reset-confirm-modal-header">
          <h2 className="reset-confirm-modal-title">진행사항 초기화</h2>
          <p className="reset-confirm-modal-warning">
            ⚠️ 모든 레벨 진행도와 기록이 삭제됩니다
          </p>
        </div>
        <div className="reset-confirm-modal-content">
          <p className="reset-confirm-modal-message">
            정말로 모든 진행사항을 초기화하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </p>
        </div>
        <div className="reset-confirm-modal-actions">
          <button
            className="reset-confirm-modal-button reset-confirm-modal-button-cancel"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="reset-confirm-modal-button reset-confirm-modal-button-confirm reset-confirm-modal-button-danger"
            onClick={onConfirm}
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}

