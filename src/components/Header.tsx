import { useRef, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useProfileStore } from '../stores/useProfileStore';
import { useUserStore } from '../stores/useUserStore';
import { useDebugStore } from '../stores/useDebugStore';
import { Toast } from './Toast'; // Import Toast
import './Header.css';
// DebugPanel.css는 DebugPanel 컴포넌트 내부에서 import하므로 여기서는 제거
// (동적 import된 컴포넌트의 CSS는 자동으로 분리되어 로드됨)

// ⚠️ 개발 환경에서만 동적 임포트
const DebugPanel = import.meta.env.DEV ? lazy(() => import('./DebugPanel')) : null;

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const { minerals, stamina, fetchUserData, checkStamina, setMinerals, setStamina } =
    useUserStore();

  // ⚠️ useDebugStore 사용
  const {
    isAdminMode,
    selectedResource,
    toggleAdminMode,
    setSelectedResource,
    toggleDebugPanel,
    isDebugPanelOpen,
  } = useDebugStore();

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastOpen(true);
  };

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
      navigate('/my-page?showProfileForm=true');
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

  // --- Admin Debug Mode Logic (Run Dev Only) ---
  const isDev = import.meta.env.DEV;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isDev) return;

      // Level 1: 백틱(`) 단독 키: Admin Mode 토글
      if (e.key === '`' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        toggleAdminMode();
        return;
      }

      // Level 2: Ctrl + ` (백틱): 디버그 패널 열기/닫기
      if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleDebugPanel();
        return;
      }

      // Level 1: 리소스 조작 (기존 유지)
      if (!isAdminMode || !selectedResource) return;

      if (e.key === '+' || e.key === '=') {
        if (selectedResource === 'stamina') setStamina(stamina + 1);
        if (selectedResource === 'minerals') setMinerals(minerals + 100);
        if (selectedResource === 'items') {
          const { debugAddItems } = useUserStore.getState();
          debugAddItems().then(() => showToast('아이템 +5 지급 🎒'));
        }
      } else if (e.key === '-' || e.key === '_') {
        if (selectedResource === 'stamina') setStamina(stamina - 1);
        if (selectedResource === 'minerals') setMinerals(minerals - 100);
        if (selectedResource === 'items') {
          const { debugRemoveItems } = useUserStore.getState();
          debugRemoveItems().then(() => showToast('아이템 -5 감소 🗑️'));
        }
      }
    },
    [
      isDev,
      isAdminMode,
      selectedResource,
      stamina,
      minerals,
      setStamina,
      setMinerals,
      toggleAdminMode,
      setSelectedResource,
      toggleDebugPanel,
    ]
  );

  useEffect(() => {
    // 키보드 이벤트는 window에 확실하게 바인딩
    if (isDev) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDev, handleKeyDown]);

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
            <span role="img" aria-label="stamina">
              ❤️
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
      <Toast
        message={toastMessage}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      {/* 디버그 패널 조건부 렌더링 */}
      {import.meta.env.DEV && isDebugPanelOpen && DebugPanel && (
        <Suspense
          fallback={
            <div className="debug-panel-loading">
              <div>디버그 패널 로딩 중...</div>
            </div>
          }
        >
          <DebugPanel />
        </Suspense>
      )}
    </header>
  );
}
