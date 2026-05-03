import React from 'react';
import { useGameFlowDebugBridge } from '../../hooks/useGameFlowDebugBridge';
import { Category, Topic, Difficulty, GameMode } from '../../types/quiz';
import './GameFlowSection.css';

export const GameFlowSection = React.memo(function GameFlowSection() {
  const {
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
  } = useGameFlowDebugBridge();


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
