import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { generateQuestion } from '../../utils/quizGenerator';
import { Category, Topic, Difficulty, QuizQuestion, GameMode } from '../../types/quiz';
import { useQuizStore } from '../../stores/useQuizStore';
import { STATUS, type StatusType } from '@/constants/status';

export interface GameSession {
  id: string;
  status: string;
  expires_at: string;
  created_at: string;
  game_mode: string;
  category: string;
  subject: string;
  level: number;
  is_debug_session?: boolean;
}

export function useGameFlowDebugBridge() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: StatusType; text: string } | null>(null);
  const [extendSeconds, setExtendSeconds] = useState('60');

  // 문제 생성 테스트 상태
  const [selectedCategory, setSelectedCategory] = useState<Category>('기초');
  const [selectedTopic, setSelectedTopic] = useState<Topic>('World1-기초');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [generatedQuestion, setGeneratedQuestion] = useState<QuizQuestion | null>(null);

  // 게임 모드 전환 상태
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('time-attack');
  const setGameMode = useQuizStore((state) => state.setGameMode);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

  const loadSessions = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      // 최근 10개 세션 조회 (status 무관)
      const { data, error } = await supabase
        .from('game_sessions')
        .select(
          'id, status, expires_at, created_at, game_mode, category, subject, level, is_debug_session'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSessions(data || []);

      // 현재 플레이 중인 세션이 있으면 자동 선택
      const playingSession = data?.find((s) => s.status === 'playing');
      if (playingSession) {
        setSelectedSessionId(playingSession.id);
      } else if (data && data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `세션 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleEndGame = async () => {
    if (!selectedSession || isUpdating) return;
    if (!confirm('게임을 즉시 종료하시겠습니까?')) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'completed' })
        .eq('id', selectedSession.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: STATUS.SUCCESS, text: '게임이 종료되었습니다.' });
      await loadSessions();
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `게임 종료 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExpireSession = async () => {
    if (!selectedSession || isUpdating) return;
    if (!confirm('세션을 만료 처리하시겠습니까?')) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'expired' })
        .eq('id', selectedSession.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: STATUS.SUCCESS, text: '세션이 만료 처리되었습니다.' });
      await loadSessions();
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `세션 만료 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExtendTime = async () => {
    if (!selectedSession || isUpdating) return;

    const seconds = parseInt(extendSeconds, 10);
    if (isNaN(seconds) || seconds <= 0) {
      setMessage({ type: STATUS.ERROR, text: '유효한 시간(초)을 입력하세요.' });
      return;
    }

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const currentExpiresAt = new Date(selectedSession.expires_at);
      const newExpiresAt = new Date(currentExpiresAt.getTime() + seconds * 1000);

      const { error } = await supabase
        .from('game_sessions')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('id', selectedSession.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: STATUS.SUCCESS, text: `세션 시간이 ${seconds}초 연장되었습니다.` });
      await loadSessions();
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `시간 연장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getTopicsForCategory = useCallback((category: Category): Topic[] => {
    switch (category) {
      case '기초':
        return ['World1-기초'];
      case '대수':
        return ['World1-대수'];
      case '논리':
        return ['World1-논리'];
      case '심화':
        return ['World1-심화'];
      default:
        return ['World1-기초'];
    }
  }, []);

  const handleGenerateQuestion = () => {
    try {
      const question = generateQuestion('math', 'World1', selectedTopic, 1, selectedDifficulty);
      setGeneratedQuestion(question);
      setMessage({ type: STATUS.SUCCESS, text: '문제가 생성되었습니다.' });
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `문제 생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
      setGeneratedQuestion(null);
    }
  };

  const handleGameModeChange = () => {
    try {
      setGameMode(selectedGameMode);
      setMessage({
        type: STATUS.SUCCESS,
        text: `게임 모드가 ${selectedGameMode === 'time-attack' ? '타임어택' : '서바이벌'}으로 변경되었습니다.`,
      });
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `게임 모드 변경 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  };

  return {
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    selectedSession,
    isLoading,
    isUpdating,
    message,
    extendSeconds,
    setExtendSeconds,
    selectedCategory,
    setSelectedCategory,
    selectedTopic,
    setSelectedTopic,
    selectedDifficulty,
    setSelectedDifficulty,
    generatedQuestion,
    selectedGameMode,
    setSelectedGameMode,
    loadSessions,
    handleEndGame,
    handleExpireSession,
    handleExtendTime,
    getTopicsForCategory,
    handleGenerateQuestion,
    handleGameModeChange,
  };
}
