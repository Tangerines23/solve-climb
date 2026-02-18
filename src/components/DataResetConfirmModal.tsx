import { BaseModal } from './BaseModal';
import './DataResetConfirmModal.css';

interface DataResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DataResetConfirmModal({ isOpen, onConfirm, onCancel }: DataResetConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="데이터 초기화"
      actions={
        <>
          <button
            className="btn-base btn-secondary data-reset-confirm-modal-button"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="btn-base btn-danger data-reset-confirm-modal-button"
            onClick={onConfirm}
          >
            초기화
          </button>
        </>
      }
    >
      <div className="reset-modal-content">
        <p
          className="reset-warning-text"
          style={{ color: 'var(--color-toss-red)', fontWeight: 'bold' }}
        >
          ⚠️ 모든 데이터가 삭제됩니다
        </p>
        <p className="reset-info-text">다음 데이터가 모두 삭제됩니다:</p>
        <ul className="reset-info-list" style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>• 모든 게임 기록 및 진행도</li>
          <li>• 프로필 정보</li>
          <li>• Supabase 데이터</li>
          <li>• 로컬 저장 데이터</li>
        </ul>
        <p className="reset-warning-text" style={{ marginTop: 'var(--spacing-md)' }}>
          이 작업은 되돌릴 수 없습니다.
        </p>
      </div>
    </BaseModal>
  );
}
