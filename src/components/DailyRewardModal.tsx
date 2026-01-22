import { useDailyRewardStore } from '../stores/useDailyRewardStore';
import './DailyRewardModal.css';

export function DailyRewardModal() {
  const { showModal, rewardResult, closeModal } = useDailyRewardStore();

  if (!showModal || !rewardResult) return null;

  return (
    <div className="daily-reward-overlay" onClick={closeModal}>
      <div className="daily-reward-modal" onClick={(e) => e.stopPropagation()}>
        <div className="daily-reward-header">
          <span className="daily-reward-icon">🎁</span>
          <h2 className="daily-reward-title">오늘의 출석 보상</h2>
        </div>

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

        <div className="daily-reward-footer">
          <button className="daily-reward-confirm-button" onClick={closeModal}>
            보상 받기
          </button>
        </div>
      </div>
    </div>
  );
}
