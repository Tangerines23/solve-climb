import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { ConfirmModal } from '../ConfirmModal';
import './DummyPlayerManager.css';

interface DummyPlayer {
  id: string;
  nickname: string;
  persona_type: string;
  total_mastery_score: number;
  current_tier_level: number;
  created_at: string;
}

export const DummyPlayerManager: React.FC = () => {
  const [dummyPlayers, setDummyPlayers] = useState<DummyPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchDummyPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, persona_type, total_mastery_score, current_tier_level, created_at')
      .eq('is_dummy', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch dummy players:', error);
    } else {
      setDummyPlayers(data || []);
    }
  }, []);

  useEffect(() => {
    fetchDummyPlayers();
  }, [fetchDummyPlayers]);

  const handleCreateDummy = async (type: 'newbie' | 'regular' | 'veteran') => {
    setIsLoading(true);
    setMessage(null);
    try {
      const timestamp = Date.now().toString().slice(-6);
      const nickname = `${type === 'newbie' ? '🌱' : type === 'regular' ? '👤' : '🔥'} 더미-${timestamp}`;

      const { data, error } = await supabase.rpc('debug_create_persona_player', {
        p_nickname: nickname,
        p_persona_type: type,
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message || '생성 실패');

      setMessage({ type: 'success', text: `더미 플레이어 ${nickname} 생성 완료!` });
      fetchDummyPlayers();
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: `생성 실패: ${err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : String(err)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDummy = (userId: string, nickname: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '더미 삭제',
      message: `더미 플레이어 "${nickname}"를 삭제하시겠습니까?`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const { error } = await supabase.rpc('debug_delete_dummy_user', { p_user_id: userId });
          if (error) throw error;
          setMessage({ type: 'success', text: '삭제 완료' });
          fetchDummyPlayers();
        } catch (err: unknown) {
          setMessage({
            type: 'error',
            text: `삭제 실패: ${err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : String(err)}`,
          });
        } finally {
          setIsLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: '전체 더미 삭제',
      message: '생성된 모든 더미 플레이어를 삭제하시겠습니까? (연관 기록 포함)',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const { error } = await supabase.rpc('debug_delete_all_dummies');
          if (error) throw error;
          setMessage({ type: 'success', text: '전체 삭제 완료' });
          fetchDummyPlayers();
        } catch (err: unknown) {
          setMessage({
            type: 'error',
            text: `삭제 실패: ${err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : String(err)}`,
          });
        } finally {
          setIsLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="dummy-player-manager">
      <div className="manager-header">
        <h4 className="manager-title">👥 더미 플레이어 관리 ({dummyPlayers.length})</h4>
        <button
          className="delete-all-button"
          onClick={handleDeleteAll}
          disabled={dummyPlayers.length === 0 || isLoading}
        >
          전체 삭제
        </button>
      </div>

      <div className="persona-generator-grid">
        <button
          onClick={() => handleCreateDummy('newbie')}
          disabled={isLoading}
          className="gen-btn newbie"
        >
          🌱 뉴비 생성
        </button>
        <button
          onClick={() => handleCreateDummy('regular')}
          disabled={isLoading}
          className="gen-btn regular"
        >
          👤 일반 생성
        </button>
        <button
          onClick={() => handleCreateDummy('veteran')}
          disabled={isLoading}
          className="gen-btn veteran"
        >
          🔥 고인물 생성
        </button>
      </div>

      {message && <div className={`manager-message ${message.type}`}>{message.text}</div>}

      <div className="dummy-list-container">
        {dummyPlayers.length === 0 ? (
          <div className="empty-list">데이터가 없습니다.</div>
        ) : (
          dummyPlayers.map((player) => (
            <div key={player.id} className="dummy-card">
              <div className="dummy-info">
                <div className="dummy-main">
                  <span className="dummy-nickname">{player.nickname}</span>
                  <span className={`persona-tag ${player.persona_type}`}>
                    {player.persona_type}
                  </span>
                </div>
                <div className="dummy-stats">
                  <span>🏆 {player.total_mastery_score}</span>
                  <span>🛡️ Tier {player.current_tier_level}</span>
                </div>
              </div>
              <div className="dummy-actions">
                <button
                  className="card-action-btn delete"
                  onClick={() => handleDeleteDummy(player.id, player.nickname)}
                  disabled={isLoading}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  );
};
