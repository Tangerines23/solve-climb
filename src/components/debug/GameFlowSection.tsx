import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { generateQuestion } from '../../utils/quizGenerator';
import { Category, Topic, Difficulty, QuizQuestion, GameMode } from '../../types/quiz';
import { useQuizStore } from '../../stores/useQuizStore';
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
  is_debug_session?: boolean;
}

export const GameFlowSection = React.memo(function GameFlowSection() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  useEffect(() => {
    loadSessions();
  }, []);

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
        type: 'error',
        text: `세션 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      setMessage({ type: 'success', text: '게임이 종료되었습니다.' });
      await loadSessions();
    } catch (err) {
      setMessage({
        type: 'error',
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

      setMessage({ type: 'success', text: '세션이 만료 처리되었습니다.' });
      await loadSessions();
    } catch (err) {
      setMessage({
        type: 'error',
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
      setMessage({ type: 'error', text: '유효한 시간(초)을 입력하세요.' });
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

      setMessage({ type: 'success', text: `세션 시간이 ${seconds}초 연장되었습니다.` });
      await loadSessions();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `시간 연장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 카테고리별 주제 목록
  const getTopicsForCategory = useCallback((category: Category): Topic[] => {
    // 현재는 World1 주제만 반환하도록 디버그 영역 수정
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
      const question = generateQuestion('World1', selectedCategory, 1, selectedDifficulty);
      setGeneratedQuestion(question);
      setMessage({ type: 'success', text: '문제가 생성되었습니다.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `문제 생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
      setGeneratedQuestion(null);
    }
  };

  // 카테고리 변경 시 주제 초기화
  useEffect(() => {
    const topics = getTopicsForCategory(selectedCategory);
    if (topics.length > 0 && !topics.includes(selectedTopic)) {
      setSelectedTopic(topics[0]);
    }
  }, [selectedCategory, selectedTopic, getTopicsForCategory]);

  const handleGameModeChange = () => {
    try {
      setGameMode(selectedGameMode);
      setMessage({
        type: 'success',
        text: `게임 모드가 ${selectedGameMode === 'time-attack' ? '타임어택' : '서바이벌'}으로 변경되었습니다.`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `게임 모드 변경 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="debug-section">
        <div className="debug-loading">세션 정보 불러오는 중...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="debug-section">
        <h3 className="debug-section-title">🎮 게임 플로우</h3>
        <div className="debug-empty-state">게임 세션이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🎮 게임 플로우</h3>

      <div className="debug-session-selector">
        <label htmlFor="debug-session-select" className="debug-session-selector-label">
          세션 선택:
        </label>
        <select
          id="debug-session-select"
          name="selectedSessionId"
          className="debug-session-select"
          value={selectedSessionId || ''}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          disabled={isUpdating}
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {new Date(session.created_at).toLocaleString('ko-KR')} - {session.status}{' '}
              {session.is_debug_session ? '[디버그]' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <>
          <div className="debug-session-info">
            {selectedSession.is_debug_session && (
              <div className="debug-session-badge">🐛 디버그 세션</div>
            )}
            <div className="debug-session-item">
              <span className="debug-session-label">세션 ID:</span>
              <span className="debug-session-value">{selectedSession.id.substring(0, 8)}...</span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">상태:</span>
              <span className="debug-session-value">{selectedSession.status}</span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">게임 모드:</span>
              <span className="debug-session-value">{selectedSession.game_mode}</span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">카테고리:</span>
              <span className="debug-session-value">{selectedSession.category}</span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">과목:</span>
              <span className="debug-session-value">{selectedSession.subject}</span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">레벨:</span>
              <span className="debug-session-value">{selectedSession.level}</span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">만료 시간:</span>
              <span className="debug-session-value">
                {new Date(selectedSession.expires_at).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="debug-session-item">
              <span className="debug-session-label">생성 시간:</span>
              <span className="debug-session-value">
                {new Date(selectedSession.created_at).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>

          <div className="debug-session-extend">
            <h4 className="debug-subsection-title">시간 연장</h4>
            <div className="debug-session-extend-control">
              <label htmlFor="debug-session-extend-input" className="debug-session-extend-label">
                연장 시간 (초):
              </label>
              <input
                type="number"
                id="debug-session-extend-input"
                name="extendSeconds"
                className="debug-session-extend-input"
                value={extendSeconds}
                onChange={(e) => setExtendSeconds(e.target.value)}
                min="1"
                placeholder="초"
                disabled={isUpdating}
              />
              <button
                className="debug-session-button debug-session-button-primary"
                onClick={handleExtendTime}
                disabled={isUpdating}
              >
                시간 연장
              </button>
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
              onClick={loadSessions}
              disabled={isUpdating}
            >
              새로고침
            </button>
          </div>
        </>
      )}

      {/* 게임 모드 전환 섹션 */}
      <div className="debug-game-mode-change">
        <h4 className="debug-subsection-title">게임 모드 전환</h4>
        <div className="debug-game-mode-controls">
          <div className="debug-game-mode-row">
            <label htmlFor="debug-game-mode-select" className="debug-game-mode-label">
              게임 모드:
            </label>
            <select
              id="debug-game-mode-select"
              name="selectedGameMode"
              className="debug-game-mode-select"
              value={selectedGameMode}
              onChange={(e) => setSelectedGameMode(e.target.value as GameMode)}
            >
              <option value="time-attack">타임어택</option>
              <option value="survival">서바이벌</option>
            </select>
            <button
              className="debug-session-button debug-session-button-primary"
              onClick={handleGameModeChange}
            >
              모드 변경
            </button>
          </div>
        </div>
      </div>

      {/* 문제 생성 테스트 섹션 */}
      <div className="debug-quiz-generation">
        <h4 className="debug-subsection-title">문제 생성 테스트</h4>
        <div className="debug-quiz-generation-controls">
          <div className="debug-quiz-generation-row">
            <label htmlFor="debug-quiz-category-select" className="debug-quiz-generation-label">
              카테고리:
            </label>
            <select
              id="debug-quiz-category-select"
              name="selectedCategory"
              className="debug-quiz-generation-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category)}
            >
              <option value="기초">기초</option>
              <option value="대수">대수</option>
              <option value="논리">논리</option>
              <option value="심화">심화</option>
            </select>
          </div>
          <div className="debug-quiz-generation-row">
            <label htmlFor="debug-quiz-topic-select" className="debug-quiz-generation-label">
              주제:
            </label>
            <select
              id="debug-quiz-topic-select"
              name="selectedTopic"
              className="debug-quiz-generation-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as Topic)}
            >
              {getTopicsForCategory(selectedCategory).map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
          <div className="debug-quiz-generation-row">
            <label htmlFor="debug-quiz-difficulty-select" className="debug-quiz-generation-label">
              난이도:
            </label>
            <select
              id="debug-quiz-difficulty-select"
              name="selectedDifficulty"
              className="debug-quiz-generation-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">쉬움</option>
              <option value="medium">보통</option>
              <option value="hard">어려움</option>
            </select>
          </div>
          <button
            className="debug-session-button debug-session-button-primary"
            onClick={handleGenerateQuestion}
          >
            문제 생성
          </button>
        </div>
        {generatedQuestion && (
          <div className="debug-quiz-result">
            <div className="debug-quiz-question">
              <div className="debug-quiz-question-label">문제:</div>
              <div className="debug-quiz-question-text">{generatedQuestion.question}</div>
            </div>
            <div className="debug-quiz-answer">
              <div className="debug-quiz-answer-label">정답:</div>
              <div className="debug-quiz-answer-value">{generatedQuestion.answer}</div>
            </div>
            {generatedQuestion.options && (
              <div className="debug-quiz-options">
                <div className="debug-quiz-options-label">선택지:</div>
                <div className="debug-quiz-options-list">
                  {generatedQuestion.options.map((option, index) => (
                    <span key={index} className="debug-quiz-option">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>{message.text}</div>
      )}
    </div>
  );
});
