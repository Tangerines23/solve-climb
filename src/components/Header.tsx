import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { urls } from '../utils/navigation';
import { useProfileStore } from '../stores/useProfileStore';
import { useUserStore } from '../stores/useUserStore';
import { useDebugStore } from '../stores/useDebugStore';
import './Header.css';
// DebugPanel.css는 DebugPanel 컴포넌트 내부에서 import하므로 여기서는 제거
// (동적 import된 컴포넌트의 CSS는 자동으로 분리되어 로드됨)

// ⚠️ 개발 환경에서만 동적 임포트
// ⚠️ 개발 환경에서만 동적 임포트 (App.tsx에서 전역 처리)

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const { minerals, stamina, fetchUserData, checkStamina } = useUserStore();

  // ⚠️ useDebugStore 사용
  const { isAdminMode, selectedResource, setSelectedResource, toggleDebugPanel, isDebugPanelOpen } =
    useDebugStore();

  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  useEffect(() => {
    fetchUserData();
    checkStamina();
  }, [fetchUserData, checkStamina]);

  // URL 파라미터 및 localStorage로 디버그 패널 자동 활성화
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // URL 파라미터 체크: ?debug=true
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('debug') === 'true' && !isDebugPanelOpen) {
      toggleDebugPanel();
    }

    // localStorage 체크: debug_mode = 'true'
    if (localStorage.getItem('debug_mode') === 'true' && !isDebugPanelOpen) {
      toggleDebugPanel();
    }
  }, [location.search, isDebugPanelOpen, toggleDebugPanel]);

  const handleNotificationClick = () => {
    navigate(APP_CONFIG.ROUTES.NOTIFICATIONS);
  };

  const handleLogoDoubleClick = () => {
    if (isAdmin) {
      navigate(urls.myPage({ showProfileForm: true }));
    }
  };

  const handleLogoClick = () => {
    if (!isAdmin) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    if (timeSinceLastClick < 300) {
      handleLogoDoubleClick();
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = null;
      }
    } else {
      doubleClickTimeoutRef.current = setTimeout(() => {
        doubleClickTimeoutRef.current = null;
      }, 300);
    }

    lastClickTimeRef.current = now;
  };

  // --- Admin Debug Mode: 클릭 기반 조작 (키보드 단축키는 App.tsx의 useDebugShortcuts 훅에서 처리) ---

  const handleStaminaClick = (e: React.MouseEvent) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setSelectedResource(selectedResource === 'stamina' ? null : 'stamina');
  };

  const handleMineralsClick = (e: React.MouseEvent) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setSelectedResource(selectedResource === 'minerals' ? null : 'minerals');
  };

  const handleItemsClick = (e: React.MouseEvent) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setSelectedResource(selectedResource === 'items' ? null : 'items');
  };

  const clearSelection = () => {
    setSelectedResource(null);
  };

  return (
    <header
      className={`app-header ${isAdminMode ? 'admin-mode-active' : ''}`}
      onClick={clearSelection}
    >
      <div className="header-content">
        <h1
          className="header-logo"
          onClick={handleLogoClick}
          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
        >
          {APP_CONFIG.APP_NAME}
        </h1>
        <div className="header-status">
          {isAdminMode && (
            <div
              className="admin-badge"
              onClick={(e) => {
                e.stopPropagation();
                toggleDebugPanel();
              }}
              style={{ cursor: 'pointer' }}
            >
              DEV
            </div>
          )}
          <div
            className={`status-item ${selectedResource === 'stamina' ? 'selected' : ''}`}
            onClick={handleStaminaClick}
            style={{ cursor: isAdminMode ? 'pointer' : 'default' }}
          >
            <span role="img" aria-label="stamina" className="status-icon stamina-icon">
              ⚡
            </span>
            <span className="status-value">{stamina}</span>
          </div>
          <div
            className={`status-item ${selectedResource === 'minerals' ? 'selected' : ''}`}
            onClick={handleMineralsClick}
            style={{ cursor: isAdminMode ? 'pointer' : 'default' }}
          >
            <span role="img" aria-label="minerals">
              💎
            </span>
            <span className="status-value">{minerals}</span>
          </div>
          {isAdminMode && (
            <div
              className={`status-item ${selectedResource === 'items' ? 'selected' : ''}`}
              onClick={handleItemsClick}
              style={{ cursor: 'pointer' }}
            >
              <span role="img" aria-label="items">
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
