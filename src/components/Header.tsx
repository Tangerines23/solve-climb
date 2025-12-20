import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useProfileStore } from '../stores/useProfileStore';
import { useUserStore } from '../stores/useUserStore';
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const isAdmin = useProfileStore((state) => state.isAdmin);
  const { minerals, stamina, fetchUserData, checkStamina, setMinerals, setStamina } = useUserStore();

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState<'stamina' | 'minerals' | null>(null);

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
    } else if (e.key === '-' || e.key === '_') {
      if (selectedResource === 'stamina') setStamina(stamina - 1);
      if (selectedResource === 'minerals') setMinerals(minerals - 100);
    }
  }, [isDev, isAdminMode, selectedResource, stamina, minerals, setStamina, setMinerals]);

  useEffect(() => {
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
          {isAdminMode && <div className="admin-badge">DEV DEBUG</div>}
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
    </header>
  );
}

