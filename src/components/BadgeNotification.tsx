import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useBadgeStore, type BadgeDefinition } from '../stores/useBadgeStore';
import './BadgeNotification.css';

interface BadgeNotificationProps {
  badgeIds: string[];
  onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badgeIds, onClose }) => {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (badgeIds.length === 0) {
      setBadges([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchBadges = async () => {
      try {
        const { data, error } = await supabase
          .from('badge_definitions')
          .select('id, name, description, emoji')
          .in('id', badgeIds);

        if (!isMounted) return;

        if (error) {
          console.error('Failed to load badge definitions:', error);
          const storeDefs = useBadgeStore
            .getState()
            .badgeDefinitions.filter((b) => badgeIds.includes(b.id));
          setBadges(storeDefs);
        } else if (!data || data.length === 0) {
          const storeDefs = useBadgeStore
            .getState()
            .badgeDefinitions.filter((b) => badgeIds.includes(b.id));
          setBadges(storeDefs);
        } else {
          setBadges(data as BadgeDefinition[]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load badge definitions:', err);
        const storeDefs = useBadgeStore
          .getState()
          .badgeDefinitions.filter((b) => badgeIds.includes(b.id));
        setBadges(storeDefs);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBadges();

    return () => {
      isMounted = false;
    };
  }, [badgeIds]);

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
          {badges.map((badge) => (
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
