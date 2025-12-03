// 데이터 초기화 확인 모달
import React from 'react';
import './DataResetConfirmModal.css';

interface DataResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DataResetConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: DataResetConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="data-reset-confirm-modal-overlay" onClick={onCancel}>
      <div className="data-reset-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="data-reset-confirm-modal-header">
          <h2 className="data-reset-confirm-modal-title">데이터 초기화</h2>
          <p className="data-reset-confirm-modal-warning">
            ⚠️ 모든 데이터가 삭제됩니다
          </p>
        </div>
        <div className="data-reset-confirm-modal-content">
          <p className="data-reset-confirm-modal-message">
            다음 데이터가 모두 삭제됩니다:
          </p>
          <ul className="data-reset-confirm-modal-list">
            <li>• 모든 게임 기록 및 진행도</li>
            <li>• 프로필 정보</li>
            <li>• Supabase 데이터</li>
            <li>• 로컬 저장 데이터</li>
          </ul>
          <p className="data-reset-confirm-modal-warning-text">
            이 작업은 되돌릴 수 없습니다.
          </p>
        </div>
        <div className="data-reset-confirm-modal-actions">
          <button
            className="data-reset-confirm-modal-button data-reset-confirm-modal-button-cancel"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="data-reset-confirm-modal-button data-reset-confirm-modal-button-confirm data-reset-confirm-modal-button-danger"
            onClick={onConfirm}
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}

