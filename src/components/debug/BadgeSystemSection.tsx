import { useBadgeDebugBridge } from '../../hooks/useBadgeDebugBridge';
import { Toast } from '../Toast';
import { STATUS } from '../../constants/status';
import './BadgeSystemSection.css';

export function BadgeSystemSection() {
  const {
    badgeDefinitions,
    userBadges,
    isLoading,
    isUpdating,
    message,
    isVerifyingSync,
    syncResult,
    earnedBadges,
    selectedBadgeId,
    toastMessage,
    isToastOpen,
    setSelectedBadgeId,
    setIsToastOpen,
    handleBadgeToggle,
    handleResetAllBadges,
    handleSeedBadges,
    handleVerifySync,
    handleShowBadgeNotification,
  } = useBadgeDebugBridge();

  const handleResetWithConfirm = async () => {
    if (confirm('모든 뱃지를 제거하시겠습니까?')) {
      await handleResetAllBadges();
    }
  };

  const handleSeedWithConfirm = async () => {
    if (
      confirm(
        '기본 뱃지 정의를 데이터베이스에 추가하시겠습니까? (기존 정의는 유지되거나 업데이트됩니다)'
      )
    ) {
      await handleSeedBadges();
    }
  };

  if (isLoading) {
    return (
      <div className="debug-section">
        <div className="debug-loading">뱃지 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🎖️ 뱃지 시스템</h3>

      <div className="debug-sync-control">
        <button className="debug-sync-button" onClick={handleVerifySync} disabled={isVerifyingSync}>
          {isVerifyingSync ? '검증 중...' : '동기화 확인'}
        </button>
      </div>

      <div className="debug-badge-controls">
        <button
          className="debug-badge-reset-button"
          onClick={handleResetWithConfirm}
          disabled={isUpdating}
        >
          모든 뱃지 초기화
        </button>
        <button
          className="debug-badge-seed-button"
          onClick={handleSeedWithConfirm}
          disabled={isUpdating}
          style={{ marginLeft: 'var(--spacing-sm)', backgroundColor: 'var(--color-success)' }}
        >
          기본 뱃지 설치 (Seeding)
        </button>
      </div>

      <div className="debug-badge-notification-test">
        <h4 className="debug-subsection-title">뱃지 알림 테스트</h4>
        <div className="debug-badge-notification-controls">
          <div className="debug-badge-notification-row">
            <label htmlFor="debug-badge-select" className="debug-badge-notification-label">
              뱃지 선택:
            </label>
            <select
              id="debug-badge-select"
              name="selectedBadgeId"
              className="debug-badge-notification-select"
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
            >
              <option value="">뱃지 선택</option>
              {earnedBadges.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.emoji || '🎖️'} {badge.name}
                </option>
              ))}
            </select>
            <button
              className="debug-badge-notification-button"
              onClick={handleShowBadgeNotification}
              disabled={!selectedBadgeId}
            >
              알림 표시
            </button>
          </div>
        </div>
      </div>

      <div className="debug-badge-list">
        {badgeDefinitions.map((badge) => {
          const isEarned = userBadges.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`debug-badge-item ${isEarned ? 'earned' : 'locked'}`}
              onClick={() => handleBadgeToggle(badge.id)}
            >
              <div className="debug-badge-icon">{isEarned && badge.emoji ? badge.emoji : '🔒'}</div>
              <div className="debug-badge-info">
                <div className="debug-badge-name">{isEarned ? badge.name : '???'}</div>
                {badge.description && (
                  <div className="debug-badge-description">{badge.description}</div>
                )}
              </div>
              <div className="debug-badge-status">{isEarned ? '✅' : '❌'}</div>
            </div>
          );
        })}
      </div>

      {syncResult && (
        <div className="debug-sync-result">
          <h4 className="debug-subsection-title">동기화 검증 결과</h4>
          <div className="debug-sync-item">
            <span className="debug-sync-label">프로필:</span>
            <span
              className={`debug-sync-status ${syncResult.profile.synced ? STATUS.SUCCESS : STATUS.ERROR}`}
            >
              {syncResult.profile.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">티어:</span>
            <span
              className={`debug-sync-status ${syncResult.tier.synced ? STATUS.SUCCESS : STATUS.ERROR}`}
            >
              {syncResult.tier.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">뱃지:</span>
            <span
              className={`debug-sync-status ${syncResult.badges.synced ? STATUS.SUCCESS : STATUS.ERROR}`}
            >
              {syncResult.badges.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">인벤토리:</span>
            <span
              className={`debug-sync-status ${syncResult.inventory.synced ? STATUS.SUCCESS : STATUS.ERROR}`}
            >
              {syncResult.inventory.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          {(syncResult.profile.issues.length > 0 ||
            syncResult.tier.issues.length > 0 ||
            syncResult.badges.issues.length > 0 ||
            syncResult.inventory.issues.length > 0) && (
            <div className="debug-sync-issues">
              <h5 className="debug-sync-issues-title">발견된 문제:</h5>
              <ul className="debug-sync-issues-list">
                {syncResult.profile.issues.map((issue, idx) => (
                  <li key={`profile-${idx}`}>{issue}</li>
                ))}
                {syncResult.tier.issues.map((issue, idx) => (
                  <li key={`tier-${idx}`}>{issue}</li>
                ))}
                {syncResult.badges.issues.map((issue, idx) => (
                  <li key={`badges-${idx}`}>{issue}</li>
                ))}
                {syncResult.inventory.issues.map((issue, idx) => (
                  <li key={`inventory-${idx}`}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>{message.text}</div>
      )}

      <Toast
        message={toastMessage}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}
