import React from 'react';
import { useBadgeNotification } from '../hooks/useBadgeNotification';
import './BadgeNotification.css';

interface BadgeNotificationProps {
  badgeIds: string[];
  onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badgeIds, onClose }) => {
  const { badgeDefs, loading } = useBadgeNotification(badgeIds, onClose);

  if (badgeIds.length === 0 || loading) return null;

  return (
    <div
      className="badge-notification-overlay"
      style={{ zIndex: 'var(--z-toast)' }}
      onClick={onClose}
    >
      <div className="badge-notification" onClick={(e) => e.stopPropagation()}>
        <div className="badge-notification-header">
          <h2>🎉 뱃지 획득! 🎉</h2>
        </div>
        <div className="badge-notification-content">
          {badgeDefs.map((badge) => (
            <div key={badge.id} className="badge-notification-item">
              <div className="badge-notification-icon">{badge.emoji || '🏆'}</div>
              <div className="badge-notification-info">
                <div className="badge-notification-name">{badge.name}</div>
                {badge.description && (
                  <div className="badge-notification-description">{badge.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="badge-notification-actions">
          <button className="badge-notification-button" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
