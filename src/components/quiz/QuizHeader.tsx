import React from 'react';
import { TimerCircle } from '../TimerCircle';
import { getItemEmoji } from '../../constants/items';
import { useQuiz } from '@/contexts/QuizContext';
import { GAME_MODES, UI_MESSAGES } from '../../constants/ui';

export const QuizHeader = React.memo(() => {
  const { quizState, quizAnimations, quizHandlers, activeItems, usedItems, score, handleTimeUp } =
    useQuiz();

  const { gameMode, timeLimit, questionKey, timerResetKey, totalQuestions } = quizState;
  const { isSubmitting, isPaused } = quizAnimations;
  const { onPause } = quizHandlers;

  const currentSurvivalDuration = quizState.timeLimit;

  return (
    <>
      <header className="quiz-header-rework">
        <div className="header-left-controls">
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
          <div className="timer-wrapper">
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
          </div>
        </div>

        <div className="header-right-score">
          <div
            className={`pill-card score-capsule ${totalQuestions > 0 ? 'pulse' : ''}`}
            key={`score-${totalQuestions}`}
          >
            <span className="score-val">{Math.floor(score).toLocaleString()}</span>
            <span className="score-unit">{UI_MESSAGES.UNIT_METERS}</span>
          </div>
        </div>
      </header>
    </>
  );
});

QuizHeader.displayName = 'QuizHeader';
