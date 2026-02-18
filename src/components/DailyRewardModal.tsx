import { useDailyRewardStore } from '../stores/useDailyRewardStore';
import { BaseModal } from './BaseModal';
import './DailyRewardModal.css';

export function DailyRewardModal() {
  const { showModal, rewardResult, closeModal } = useDailyRewardStore();

  if (!showModal || !rewardResult) return null;

  return (
    <BaseModal
      isOpen={showModal}
      onClose={closeModal}
      title={
        <div className="daily-reward-header-content">
          <span className="daily-reward-icon">🎁</span>
          <h2 className="daily-reward-title">오늘의 출석 보상</h2>
        </div>
      }
      actions={
        <button className="btn-base btn-primary daily-reward-confirm-button" onClick={closeModal}>
          보상 받기
        </button>
      }
    >
      <div className="daily-reward-body">
        <div className="streak-info">
          <span className="streak-label">연속 출석</span>
          <span className="streak-value">{rewardResult.streak}일째</span>
        </div>

        <div className="reward-info">
          <div className="reward-item">
            <span className="reward-icon">💎</span>
            <span className="reward-amount">+{rewardResult.reward_minerals} 미네랄</span>
          </div>
          <p className="reward-message">내일도 접속하여 더 큰 보상을 받으세요!</p>
        </div>
      </div>
    </BaseModal>
  );
}
