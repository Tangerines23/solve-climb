import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useProfileStore } from '../stores/useProfileStore';
import { useUserStore } from '../stores/useUserStore';
import { Toast } from './Toast'; // Import Toast
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const { minerals, stamina, fetchUserData, checkStamina, setMinerals, setStamina } = useUserStore();

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState<'stamina' | 'minerals' | 'items' | null>(null);

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isDev) return;

    // Toggle Admin Mode with Backtick (`)
    if (e.key === '`') {
      setIsAdminMode(prev => !prev);
      if (isAdminMode) setSelectedResource(null);
      return;
    }

    if (!isAdminMode || !selectedResource) return;

    if (e.key === '+' || e.key === '=') {
      if (selectedResource === 'stamina') setStamina(stamina + 1);
      if (selectedResource === 'minerals') setMinerals(minerals + 100);
      if (selectedResource === 'items') {
        const { debugAddItems } = useUserStore.getState();
        debugAddItems().then(() => showToast("아이템 +5 지급 🎒"));
      }
    } else if (e.key === '-' || e.key === '_') {
      if (selectedResource === 'stamina') setStamina(stamina - 1);
      if (selectedResource === 'minerals') setMinerals(minerals - 100);
      if (selectedResource === 'items') {
        const { debugRemoveItems } = useUserStore.getState();
        debugRemoveItems().then(() => showToast("아이템 -5 감소 🗑️"));
      }
    }
  }, [isDev, isAdminMode, selectedResource, stamina, minerals, setStamina, setMinerals]);

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
    setSelectedResource(prev => prev === 'stamina' ? null : 'stamina');
  };

  const handleMineralsClick = (e: React.MouseEvent) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setSelectedResource(prev => prev === 'minerals' ? null : 'minerals');
  };

  const handleItemsClick = (e: React.MouseEvent) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setSelectedResource(prev => prev === 'items' ? null : 'items');
  };

  const clearSelection = () => {
    setSelectedResource(null);
  };

  return (
    <header className={`app-header ${isAdminMode ? 'admin-mode-active' : ''}`} onClick={clearSelection}>
      <div className="header-content">
        <h1
          className="header-logo"
          onClick={handleLogoClick}
          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
        >
          {APP_CONFIG.APP_NAME}
        </h1>
        <div className="header-status">
          {isAdminMode && <div className="admin-badge">DEV</div>}
          <div
            className={`status-item ${selectedResource === 'stamina' ? 'selected' : ''}`}
            onClick={handleStaminaClick}
            style={{ cursor: isAdminMode ? 'pointer' : 'default' }}
          >
            <span role="img" aria-label="stamina">❤️</span>
            <span className="status-value">{stamina}</span>
          </div>
          <div
            className={`status-item ${selectedResource === 'minerals' ? 'selected' : ''}`}
            onClick={handleMineralsClick}
            style={{ cursor: isAdminMode ? 'pointer' : 'default' }}
          >
            <span role="img" aria-label="minerals">💎</span>
            <span className="status-value">{minerals}</span>
          </div>
          {isAdminMode && (
            <div
              className={`status-item ${selectedResource === 'items' ? 'selected' : ''}`}
              onClick={handleItemsClick}
              style={{ cursor: 'pointer' }}
            >
              <span role="img" aria-label="items">📦</span>
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
    </header>
  );
}

