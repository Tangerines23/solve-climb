import React from 'react';
import { TimerCircle } from '../TimerCircle';
import { getItemEmoji } from '../../constants/items';
import { useQuiz } from '@/contexts/QuizContext';
import { GAME_MODES, UI_MESSAGES } from '../../constants/ui';
import { useGameStore } from '../../stores/useGameStore';
import { useDebugStore } from '../../stores/useDebugStore';

export const QuizHeader = React.memo(() => {
  const { quizState, quizAnimations, quizHandlers, activeItems, usedItems, score, handleTimeUp } =
    useQuiz();
  const combo = useGameStore((state) => state.combo);
  const { isAdminMode, toggleDebugPanel } = useDebugStore();

  const { gameMode, timeLimit, questionKey, timerResetKey, totalQuestions } = quizState;
  const { isSubmitting, isPaused } = quizAnimations;
  const { onPause } = quizHandlers;

  const currentSurvivalDuration = quizState.timeLimit;

  return (
    <>
      <header className="quiz-header-rework">
        <div className="header-left-controls">
          <div className="left-top-row" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="pause-button" onClick={onPause} aria-label={UI_MESSAGES.PAUSE}>
              <svg
                className="pause-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="10" y1="16" x2="10" y2="8" />
                <line x1="14" y1="16" x2="14" y2="8" />
              </svg>
              {gameMode === GAME_MODES.SURVIVAL && <span className="pause-count-badge">3</span>}
            </button>

            {isAdminMode && (
              <div
                className="admin-badge clickable"
                style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: 'var(--color-primary, #00d2c4)',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '20px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDebugPanel();
                }}
              >
                DEV
              </div>
            )}
          </div>

          <div className="vertical-item-stack">
            {activeItems.map((code, i) => (
              <div key={`active-${i}`} className="side-item active">
                {getItemEmoji(code)}
              </div>
            ))}
            {usedItems.map((code, i) => (
              <div key={`used-${i}`} className="side-item used">
                {getItemEmoji(code)}
              </div>
            ))}
          </div>
        </div>

        <div className="header-center-timer">
          <div
            className="timer-wrapper"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}
          >
            {quizState.isPreview &&
              quizState.categoryParam !== '히라가나' &&
              quizState.categoryParam !== '가타카나' &&
              quizState.categoryParam !== '어휘' &&
              quizState.categoryParam !== 'hiragana' &&
              quizState.categoryParam !== 'katakana' &&
              quizState.categoryParam !== 'vocabulary' &&
              quizState.subParam !== 'LangWorld1' &&
              quizState.mountainParam !== 'language' && (
                <button
                  className="header-keyboard-switch-btn prev"
                  onClick={() => quizHandlers.handleSwitchKeyboard?.()}
                  aria-label="이전 키보드"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                    transition: 'color 0.2s, transform 0.2s',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.6)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  ‹
                </button>
              )}

            {gameMode === GAME_MODES.SURVIVAL ? (
              <TimerCircle
                duration={currentSurvivalDuration}
                onComplete={handleTimeUp}
                isPaused={isSubmitting || isPaused}
                key={`${questionKey}-${timerResetKey || 0}`}
              />
            ) : (
              <TimerCircle
                duration={timeLimit}
                onComplete={handleTimeUp}
                isPaused={isPaused}
                enableFastForward={true}
                key={`${timeLimit}-${timerResetKey || 0}`}
              />
            )}

            {quizState.isPreview &&
              quizState.categoryParam !== '히라가나' &&
              quizState.categoryParam !== '가타카나' &&
              quizState.categoryParam !== '어휘' &&
              quizState.categoryParam !== 'hiragana' &&
              quizState.categoryParam !== 'katakana' &&
              quizState.categoryParam !== 'vocabulary' &&
              quizState.subParam !== 'LangWorld1' &&
              quizState.mountainParam !== 'language' && (
                <button
                  className="header-keyboard-switch-btn next"
                  onClick={() => quizHandlers.handleSwitchKeyboard?.()}
                  aria-label="다음 키보드"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                    transition: 'color 0.2s, transform 0.2s',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.6)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  ›
                </button>
              )}
          </div>
        </div>

        <div className="header-right-score">
          <div className="score-combo-stack">
            <div
              className={`pill-card score-capsule ${totalQuestions > 0 ? 'pulse' : ''}`}
              key={`score-${totalQuestions}`}
            >
              <span className="score-val">{Math.floor(score).toLocaleString()}</span>
              <span className="score-unit">{UI_MESSAGES.UNIT_METERS}</span>
            </div>

            {combo >= 2 && (
              <div className="combo-mini-badge" key={`combo-${combo}`}>
                <span className="combo-num">{combo}</span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
});

QuizHeader.displayName = 'QuizHeader';
