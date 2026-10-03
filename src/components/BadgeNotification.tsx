import React, { useEffect } from 'react';
import { useBadgeStore, type BadgeDefinition } from '../stores/useBadgeStore';
import './BadgeNotification.css';

export interface BadgeNotificationProps {
  badgeIds: string[];
  onClose: () => void;
  /**
   * 독립적인 프레젠테이션 및 단위 테스트를 위한 선택적 뱃지 데이터 주입
   */
  badges?: BadgeDefinition[];
}

/**
 * 획득한 뱃지 ID 목록에 대응하는 뱃지 정의 객체들을 필터링합니다. (Zero-Else, O(N))
 */
export function filterBadgesByIds(
  definitions: BadgeDefinition[],
  badgeIds: string[]
): BadgeDefinition[] {
  if (badgeIds.length === 0) return [];
  const idSet = new Set(badgeIds);
  return definitions.filter((b) => idSet.has(b.id));
}

/**
 * [BadgeNotification]
 * 뱃지 획득 시 팝업 형태로 알려주는 UI 컴포넌트입니다.
 * Supabase 직접 통신을 완전히 제거하고 useBadgeStore 상태를 기반으로 순수 렌더링을 수행합니다.
 */
export const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badgeIds,
  onClose,
  badges: customBadges,
}) => {
  const badgeDefinitions = useBadgeStore((state) => state.badgeDefinitions);
  const fetchBadgeDefinitions = useBadgeStore((state) => state.fetchBadgeDefinitions);
  const isLoadingDefinitions = useBadgeStore((state) => state.isLoadingDefinitions);

  useEffect(() => {
    if (customBadges) return;
    if (badgeDefinitions.length > 0) return;
    if (badgeIds.length === 0) return;

    fetchBadgeDefinitions();
  }, [badgeIds.length, badgeDefinitions.length, customBadges, fetchBadgeDefinitions]);

  const displayBadges = customBadges ?? filterBadgesByIds(badgeDefinitions, badgeIds);

  useEffect(() => {
    // 3초 후 자동으로 닫기
    if (badgeIds.length === 0 || isLoadingDefinitions || displayBadges.length === 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [badgeIds.length, isLoadingDefinitions, displayBadges.length, onClose]);

  if (badgeIds.length === 0 || isLoadingDefinitions || displayBadges.length === 0) {
    return null;
  }

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
          {displayBadges.map((badge) => (
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
