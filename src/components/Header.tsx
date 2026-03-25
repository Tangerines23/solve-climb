import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { urls } from '../utils/navigation';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUserStore } from '../stores/useUserStore';
import { useDebugStore } from '../stores/useDebugStore';
import { useToastStore } from '../stores/useToastStore';
import { storageService, STORAGE_KEYS } from '../services';
import './Header.css';
// DebugPanel.css는 DebugPanel 컴포넌트 내부에서 import하므로 여기서는 제거
// (동적 import된 컴포넌트의 CSS는 자동으로 분리되어 로드됨)

// ⚠️ 개발 환경에서만 동적 임포트
// ⚠️ 개발 환경에서만 동적 임포트 (App.tsx에서 전역 처리)

// ⚠️ 개발 환경에서만 동적 임포트 (App.tsx에서 전역 처리)

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMineralsLoading, setIsMineralsLoading] = useState(false);
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const { minerals, stamina, fetchUserData, checkStamina, recoverMineralsAds } = useUserStore();
  const { showToast } = useToastStore();

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
    if (storageService.get<string>(STORAGE_KEYS.DEBUG_MODE) === 'true' && !isDebugPanelOpen) {
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

  const handleMineralsAdRecharge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMineralsLoading) return;

    setIsMineralsLoading(true);
    showToast('광고를 불러오는 중... 📺', 'info');

    const result = await recoverMineralsAds();
    if (result.success) {
      showToast(result.message, '💎');
    }
    setIsMineralsLoading(false);
  };

  const handleItemsClick = (e: React.MouseEvent) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setSelectedResource(selectedResource === 'items' ? null : 'items');
  };

  const clearSelection = () => {
    setSelectedResource(null);
  };

  // 마이페이지(로그인/프로필 설정)에서는 헤더 숨김
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const session = useAuthStore((state) => state.session);
  const isMyPage = location.pathname === APP_CONFIG.ROUTES.MY_PAGE;

  if (isMyPage && (!session || !isProfileComplete)) {
    return null;
  }

  return (
    <header
      className={`app-header ${isAdminMode ? 'admin-mode-active' : ''}`}
      onClick={clearSelection}
    >
      <div className="header-content">
        {showBack && (
          <button onClick={onBack} className="header-back-button">
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
