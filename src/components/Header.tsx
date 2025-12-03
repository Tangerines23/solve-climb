import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import './Header.css';

export function Header() {
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate(APP_CONFIG.ROUTES.NOTIFICATIONS);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-logo">{APP_CONFIG.APP_NAME}</h1>
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

