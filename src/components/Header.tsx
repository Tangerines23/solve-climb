import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useProfileStore } from '../stores/useProfileStore';
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const { isAdmin } = useProfileStore();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

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
      // 더블클릭 감지
      handleLogoDoubleClick();
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = null;
      }
    } else {
      // 첫 클릭
      doubleClickTimeoutRef.current = setTimeout(() => {
        doubleClickTimeoutRef.current = null;
      }, 300);
    }

    lastClickTimeRef.current = now;
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 
          className="header-logo" 
          onClick={handleLogoClick}
          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
        >
          {APP_CONFIG.APP_NAME}
        </h1>
        <div className="header-icons">
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

