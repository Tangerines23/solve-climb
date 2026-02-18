import { BaseModal } from './BaseModal';
import './WithdrawConfirmModal.css';

interface WithdrawConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WithdrawConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}: WithdrawConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        <div className="withdraw-modal-header">
          <span className="withdraw-modal-icon">⚠️</span>
          <span className="withdraw-modal-title-text">정말로 탈퇴하시겠습니까?</span>
        </div>
      }
      actions={
        <div className="withdraw-modal-actions">
          <button
            className="btn-base btn-secondary withdraw-modal-button"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            className="btn-base btn-danger withdraw-modal-button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      }
    >
      <div className="withdraw-modal-description">
        <p>
          탈퇴 시 다음 정보가 <strong>영구히 삭제</strong>되며 복구할 수 없습니다:
        </p>
        <ul className="withdraw-modal-list">
          <li>• 모든 게임 점수 및 진행 기록</li>
          <li>• 보유 중인 모든 아이템 및 미네랄</li>
          <li>• 프로필 및 계정 정보</li>
        </ul>
        <p className="withdraw-modal-warning-text">이 작업은 취소할 수 없습니다.</p>
      </div>
    </BaseModal>
  );
}
