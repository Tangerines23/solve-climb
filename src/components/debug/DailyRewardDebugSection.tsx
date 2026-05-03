import { useDebugActions } from '@/hooks/useDebugActions';

export function DailyRewardDebugSection() {
  const { checkDailyLogin, triggerManualReward } = useDebugActions();

  const handleManualTrigger = () => {
    triggerManualReward();
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🎁 데일리 시스템 관리</h3>
      <div
        className="debug-section-actions"
        style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}
      >
        <button
          className="debug-button"
          onClick={() => checkDailyLogin()}
          title="서버에 실제 출석 체크를 요청합니다 (이미 수령했다면 실패)"
        >
          실제 출석 체크 (RPC)
        </button>
        <button
          className="debug-button debug-button-primary"
          onClick={handleManualTrigger}
          title="오늘 보상 여부와 상관없이 팝업 UI를 강제로 띄웁니다"
        >
          보상 팝업 강제 노출
        </button>
      </div>
    </div>
  );
}
