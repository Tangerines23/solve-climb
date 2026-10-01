import { BaseModal } from './BaseModal';
import './AnonymousDataWarningModal.css';

interface AnonymousDataWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToMyPage: () => void;
}

export function AnonymousDataWarningModal({
  isOpen,
  onClose,
  onGoToMyPage,
}: AnonymousDataWarningModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ 데이터 유실 주의 안내"
      actions={
        <div className="anon-warning-modal-actions">
          <button className="btn-base btn-secondary" onClick={onClose}>
            나중에 하기
          </button>
          <button className="btn-base btn-primary" onClick={onGoToMyPage}>
            3초 계정 연동하기
          </button>
        </div>
      }
    >
      <div className="anon-warning-modal-content">
        <span className="anon-warning-modal-badge">익명 임시 계정 이용 중</span>
        <p className="anon-warning-modal-desc">
          현재 <strong className="anon-warning-modal-highlight">익명 계정</strong>으로 플레이
          중입니다.
        </p>
        <p className="anon-warning-modal-desc">
          기기를 변경하거나 브라우저 캐시 삭제, 앱 재설치 시 지금까지 획득한 모든{' '}
          <strong className="anon-warning-modal-highlight">등반 기록, 랭킹 점수, 뱃지</strong>가
          영구 삭제될 수 있습니다.
        </p>
        <p className="anon-warning-modal-desc">
          마이페이지에서{' '}
          <strong className="anon-warning-modal-highlight">3초 로그인(Google/Toss)</strong>을 통해
          소중한 기록을 안전하게 보관하세요!
        </p>
      </div>
    </BaseModal>
  );
}
