import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface DummyPlayer {
  id: string;
  nickname: string;
  persona_type: string;
  total_mastery_score: number;
  current_tier_level: number;
  created_at: string;
}

export function useDummyPlayerDebugBridge() {
  const [dummyPlayers, setDummyPlayers] = useState<DummyPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleCreateDummy = useCallback(async (type: 'newbie' | 'regular' | 'veteran') => {
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
      await fetchDummyPlayers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchDummyPlayers]);

  const handleDeleteDummy = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('debug_delete_dummy_user', { p_user_id: userId });
      if (error) throw error;
      setMessage({ type: 'success', text: '삭제 완료' });
      await fetchDummyPlayers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchDummyPlayers]);

  const handleDeleteAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('debug_delete_all_dummies');
      if (error) throw error;
      setMessage({ type: 'success', text: '전체 삭제 완료' });
      await fetchDummyPlayers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchDummyPlayers]);

  return {
    dummyPlayers,
    isLoading,
    message,
    handleCreateDummy,
    handleDeleteDummy,
    handleDeleteAll,
  };
}
