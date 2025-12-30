import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
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

      <div className="debug-badge-controls">
        <button
          className="debug-badge-reset-button"
          onClick={handleResetAllBadges}
          disabled={isUpdating}
        >
          모든 뱃지 초기화
        </button>
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

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

