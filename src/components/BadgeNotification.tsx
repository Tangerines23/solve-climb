// src/components/BadgeNotification.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import './BadgeNotification.css';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

interface BadgeNotificationProps {
  badgeIds: string[];
  onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badgeIds,
  onClose
}) => {
  const [badgeDefs, setBadgeDefs] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadgeDefinitions = async () => {
      if (badgeIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('badge_definitions')
          .select('id, name, description, emoji')
          .in('id', badgeIds);

        if (error) throw error;
        setBadgeDefs(data || []);
      } catch (error) {
        console.error('Failed to load badge definitions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadgeDefinitions();
  }, [badgeIds]);

  useEffect(() => {
    // 3초 후 자동으로 닫기
    if (badgeIds.length > 0 && !loading) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [badgeIds, loading, onClose]);

  if (badgeIds.length === 0 || loading) return null;

  return (
    <div className="badge-notification-overlay" onClick={onClose}>
      <div className="badge-notification" onClick={(e) => e.stopPropagation()}>
        <div className="badge-notification-header">
          <h2>🎉 뱃지 획득! 🎉</h2>
        </div>
        <div className="badge-notification-content">
          {badgeDefs.map((badge) => (
            <div key={badge.id} className="badge-notification-item">
              <div className="badge-notification-icon">
                {badge.emoji || '🏆'}
              </div>
              <div className="badge-notification-info">
                <div className="badge-notification-name">{badge.name}</div>
                {badge.description && (
                  <div className="badge-notification-description">
                    {badge.description}
                  </div>
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

