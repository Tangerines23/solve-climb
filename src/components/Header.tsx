import { APP_CONFIG } from '@/config/app';
import { useHeader } from '@/hooks/useHeader';
import './Header.css';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  const {
    minerals,
    stamina,
    isAdmin,
    isAdminMode,
    selectedResource,
    isMineralsLoading,
    handleNotificationClick,
    handleLogoClick,
    handleStaminaClick,
    handleMineralsClick,
    handleMineralsAdRecharge,
    handleItemsClick,
    clearSelection,
    toggleDebugPanel,
    navigate,
  } = useHeader();

  return (
    <header
      className={`app-header ${isAdminMode ? 'admin-mode-active' : ''}`}
      onClick={clearSelection}
    >

      <div className="header-content">
        {showBack && (
          <button onClick={onBack} className="header-back-button" aria-label="뒤로 가기">
            ←
          </button>
        )}
        <h1
          className={`header-logo ${isAdmin ? 'clickable' : ''} ${title ? 'has-custom-title' : ''}`}
          onClick={handleLogoClick}
        >
          {title || APP_CONFIG.APP_NAME}
        </h1>
        <div className="header-status">
          {isAdminMode && (
            <div
              className="admin-badge clickable"
              onClick={(e) => {
                e.stopPropagation();
                toggleDebugPanel();
              }}
            >
              DEV
            </div>
          )}
          <div
            className={`status-item ${selectedResource === 'stamina' ? 'selected' : ''} ${isAdminMode ? 'clickable' : ''}`}
            onClick={handleStaminaClick}
          >
            <span role="img" aria-label="stamina" className="status-icon stamina-icon">
              ⚡
            </span>
            <span className="status-value">{stamina}</span>
          </div>
          <div
            className={`status-item ${selectedResource === 'minerals' ? 'selected' : ''} ${isAdminMode ? 'clickable' : ''}`}
            onClick={handleMineralsClick}
          >
            <span role="img" aria-label="minerals" className="status-icon">
              💎
            </span>
            <span className="status-value">{minerals.toLocaleString()}</span>
            <button
              className={`recharge-btn ${isMineralsLoading ? 'loading' : ''}`}
              onClick={handleMineralsAdRecharge}
              disabled={isMineralsLoading}
              aria-label="미네랄 충전 (광고 시청)"
            >
              {isMineralsLoading ? '⏳' : '+'}
            </button>
          </div>
          {isAdminMode && (
            <div
              className={`status-item ${selectedResource === 'items' ? 'selected' : ''} clickable`}
              onClick={handleItemsClick}
            >
              <span role="img" aria-label="items" className="status-icon">
                📦
              </span>
            </div>
          )}
        </div>
        <div className="header-icons">
          <button
            className="header-icon-button"
            onClick={() => navigate('/shop')}
            aria-label="상점"
          >
            🎒
          </button>
          <button
            className="header-icon-button"
            onClick={handleNotificationClick}
            aria-label="알림"
          >
            🔔
          </button>
        </div>
      </div>

      {/* 디버그 패널 렌더링 제거 -> App.tsx로 이동 */}
    </header>
  );
}
