import React, { useEffect } from 'react';
import { useBadgeStore } from '../stores/useBadgeStore';
import './BadgeNotification.css';

interface BadgeNotificationProps {
  badgeIds: string[];
  onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badgeIds, onClose }) => {
  const badgeDefinitions = useBadgeStore((state) => state.badgeDefinitions);
  const fetchBadgeDefinitions = useBadgeStore((state) => state.fetchBadgeDefinitions);
  const isLoading = useBadgeStore((state) => state.isLoadingDefinitions);

  useEffect(() => {
    if (badgeDefinitions.length === 0) {
      fetchBadgeDefinitions();
    }
  }, [badgeDefinitions.length, fetchBadgeDefinitions]);

  const badgeDefs = badgeDefinitions.filter((b) => badgeIds.includes(b.id));

  useEffect(() => {
    // 3초 후 자동으로 닫기
    if (badgeIds.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [badgeIds, isLoading, onClose]);

  if (badgeIds.length === 0 || isLoading) return null;

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
