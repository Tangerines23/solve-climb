import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import './GameFlowSection.css';

interface GameSession {
  id: string;
  status: string;
  expires_at: string;
  created_at: string;
  game_mode: string;
  category: string;
  subject: string;
  level: number;
}

export function GameFlowSection() {
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCurrentSession();
  }, []);

  const loadCurrentSession = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      // 현재 플레이 중인 세션 조회
      const { data, error } = await supabase
        .from('game_sessions')
        .select('id, status, expires_at, created_at, game_mode, category, subject, level')
        .eq('user_id', user.id)
        .eq('status', 'playing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116은 "no rows returned" 에러이므로 정상
        throw error;
      }

      setCurrentSession(data || null);
    } catch (err) {
      setMessage({ type: 'error', text: `세션 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!currentSession || isUpdating) return;
    if (!confirm('게임을 즉시 종료하시겠습니까?')) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'completed' })
        .eq('id', currentSession.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '게임이 종료되었습니다.' });
      await loadCurrentSession();
    } catch (err) {
      setMessage({ type: 'error', text: `게임 종료 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExpireSession = async () => {
    if (!currentSession || isUpdating) return;
    if (!confirm('세션을 만료 처리하시겠습니까?')) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'expired' })
        .eq('id', currentSession.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '세션이 만료 처리되었습니다.' });
      await loadCurrentSession();
    } catch (err) {
      setMessage({ type: 'error', text: `세션 만료 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="debug-section">
        <div className="debug-loading">세션 정보 불러오는 중...</div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="debug-section">
        <h3 className="debug-section-title">🎮 게임 플로우</h3>
        <div className="debug-empty-state">
          현재 플레이 중인 게임 세션이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🎮 게임 플로우</h3>

      <div className="debug-session-info">
        <div className="debug-session-item">
          <span className="debug-session-label">세션 ID:</span>
          <span className="debug-session-value">{currentSession.id.substring(0, 8)}...</span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">상태:</span>
          <span className="debug-session-value">{currentSession.status}</span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">게임 모드:</span>
          <span className="debug-session-value">{currentSession.game_mode}</span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">카테고리:</span>
          <span className="debug-session-value">{currentSession.category}</span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">과목:</span>
          <span className="debug-session-value">{currentSession.subject}</span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">레벨:</span>
          <span className="debug-session-value">{currentSession.level}</span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">만료 시간:</span>
          <span className="debug-session-value">
            {new Date(currentSession.expires_at).toLocaleString('ko-KR')}
          </span>
        </div>
        <div className="debug-session-item">
          <span className="debug-session-label">생성 시간:</span>
          <span className="debug-session-value">
            {new Date(currentSession.created_at).toLocaleString('ko-KR')}
          </span>
        </div>
      </div>

      <div className="debug-session-actions">
        <button
          className="debug-session-button debug-session-button-danger"
          onClick={handleEndGame}
          disabled={isUpdating}
        >
          게임 즉시 종료
        </button>
        <button
          className="debug-session-button debug-session-button-warning"
          onClick={handleExpireSession}
          disabled={isUpdating}
        >
          세션 만료 처리
        </button>
        <button
          className="debug-session-button debug-session-button-secondary"
          onClick={loadCurrentSession}
          disabled={isUpdating}
        >
          새로고침
        </button>
      </div>

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

