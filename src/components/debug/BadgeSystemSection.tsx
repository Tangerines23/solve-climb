import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { verifySync, type SyncResult } from '../../utils/debugSync';
import { Toast } from '../Toast';
import './BadgeSystemSection.css';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export function BadgeSystemSection() {
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [userBadges, setUserBadges] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isVerifyingSync, setIsVerifyingSync] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  
  // 뱃지 알림 테스트 상태
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      // 뱃지 정의 조회
      const { data: definitions, error: defError } = await supabase
        .from('badge_definitions')
        .select('id, name, description, emoji')
        .order('id');

      if (defError) throw defError;
      setBadgeDefinitions(definitions || []);

      // 사용자 뱃지 조회
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      setUserBadges(new Set(badges?.map(b => b.badge_id) || []));
    } catch (err) {
      setMessage({ type: 'error', text: `뱃지 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBadgeToggle = async (badgeId: string) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const isEarned = userBadges.has(badgeId);

      if (isEarned) {
        // 뱃지 제거 (RPC 함수 사용)
        const { data, error } = await supabase.rpc('debug_remove_badge', {
          p_user_id: user.id,
          p_badge_id: badgeId,
        });

        if (error) throw error;
        setUserBadges(prev => {
          const next = new Set(prev);
          next.delete(badgeId);
          return next;
        });
        setMessage({ type: 'success', text: '뱃지가 제거되었습니다.' });
      } else {
        // 뱃지 부여
        const { data, error } = await supabase.rpc('debug_grant_badge', {
          p_user_id: user.id,
          p_badge_id: badgeId,
        });

        if (error) throw error;
        setUserBadges(prev => new Set([...prev, badgeId]));
        setMessage({ type: 'success', text: '뱃지가 부여되었습니다.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `뱃지 조작 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetAllBadges = async () => {
    if (isUpdating) return;
    if (!confirm('모든 뱃지를 제거하시겠습니까?')) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setUserBadges(new Set());
      setMessage({ type: 'success', text: '모든 뱃지가 제거되었습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: `뱃지 초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  // 획득한 뱃지 목록 (earnedBadges)
  const earnedBadges = badgeDefinitions.filter(badge => userBadges.has(badge.id));

  const handleShowBadgeNotification = () => {
    if (!selectedBadgeId) return;

    const badge = badgeDefinitions.find(b => b.id === selectedBadgeId);
    if (badge) {
      const badgeEmoji = badge.emoji || '🎖️';
      setToastMessage(`${badgeEmoji} ${badge.name} 뱃지를 획득했습니다!`);
      setIsToastOpen(true);
    }
  };

  const handleVerifySync = async () => {
    if (isVerifyingSync) return;

    try {
      setIsVerifyingSync(true);
      setSyncResult(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const result = await verifySync(user.id);
      setSyncResult(result);
    } catch (err) {
      setMessage({ type: 'error', text: `동기화 검증 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsVerifyingSync(false);
    }
  };

  if (isLoading) {
    return (
      <div className="debug-section">
        <div className="debug-loading">뱃지 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🎖️ 뱃지 시스템</h3>

      <div className="debug-sync-control">
        <button
          className="debug-sync-button"
          onClick={handleVerifySync}
          disabled={isVerifyingSync}
        >
          {isVerifyingSync ? '검증 중...' : '동기화 확인'}
        </button>
      </div>

      <div className="debug-badge-controls">
        <button
          className="debug-badge-reset-button"
          onClick={handleResetAllBadges}
          disabled={isUpdating}
        >
          모든 뱃지 초기화
        </button>
      </div>

      <div className="debug-badge-notification-test">
        <h4 className="debug-subsection-title">뱃지 알림 테스트</h4>
        <div className="debug-badge-notification-controls">
          <div className="debug-badge-notification-row">
            <label className="debug-badge-notification-label">뱃지 선택:</label>
            <select
              className="debug-badge-notification-select"
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
            >
              <option value="">뱃지 선택</option>
              {earnedBadges.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.emoji || '🎖️'} {badge.name}
                </option>
              ))}
            </select>
            <button
              className="debug-badge-notification-button"
              onClick={handleShowBadgeNotification}
              disabled={!selectedBadgeId}
            >
              알림 표시
            </button>
          </div>
        </div>
      </div>

      <div className="debug-badge-list">
        {badgeDefinitions.map((badge) => {
          const isEarned = userBadges.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`debug-badge-item ${isEarned ? 'earned' : 'locked'}`}
              onClick={() => handleBadgeToggle(badge.id)}
            >
              <div className="debug-badge-icon">
                {isEarned && badge.emoji ? badge.emoji : '🔒'}
              </div>
              <div className="debug-badge-info">
                <div className="debug-badge-name">
                  {isEarned ? badge.name : '???'}
                </div>
                {badge.description && (
                  <div className="debug-badge-description">
                    {badge.description}
                  </div>
                )}
              </div>
              <div className="debug-badge-status">
                {isEarned ? '✅' : '❌'}
              </div>
            </div>
          );
        })}
      </div>

      {syncResult && (
        <div className="debug-sync-result">
          <h4 className="debug-subsection-title">동기화 검증 결과</h4>
          <div className="debug-sync-item">
            <span className="debug-sync-label">프로필:</span>
            <span className={`debug-sync-status ${syncResult.profile.synced ? 'success' : 'error'}`}>
              {syncResult.profile.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">티어:</span>
            <span className={`debug-sync-status ${syncResult.tier.synced ? 'success' : 'error'}`}>
              {syncResult.tier.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">뱃지:</span>
            <span className={`debug-sync-status ${syncResult.badges.synced ? 'success' : 'error'}`}>
              {syncResult.badges.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">인벤토리:</span>
            <span className={`debug-sync-status ${syncResult.inventory.synced ? 'success' : 'error'}`}>
              {syncResult.inventory.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          {(syncResult.profile.issues.length > 0 || 
            syncResult.tier.issues.length > 0 || 
            syncResult.badges.issues.length > 0 || 
            syncResult.inventory.issues.length > 0) && (
            <div className="debug-sync-issues">
              <h5 className="debug-sync-issues-title">발견된 문제:</h5>
              <ul className="debug-sync-issues-list">
                {syncResult.profile.issues.map((issue, idx) => (
                  <li key={`profile-${idx}`}>{issue}</li>
                ))}
                {syncResult.tier.issues.map((issue, idx) => (
                  <li key={`tier-${idx}`}>{issue}</li>
                ))}
                {syncResult.badges.issues.map((issue, idx) => (
                  <li key={`badges-${idx}`}>{issue}</li>
                ))}
                {syncResult.inventory.issues.map((issue, idx) => (
                  <li key={`inventory-${idx}`}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <Toast
        message={toastMessage}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}

