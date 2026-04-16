import React from 'react';
import { TimerCircle } from '../TimerCircle';
import { getItemEmoji } from '../../constants/items';

import { QuizDisplayState } from '../../types/quizProps';

interface QuizHeaderProps {
  quizState: QuizDisplayState;
  activeItems: string[];
  usedItems: string[];
  score: number;
  onPause: () => void;
  handleTimeUp: () => void;
  isSubmitting: boolean;
  isPaused: boolean;
  currentSurvivalDuration: number;
}

export const QuizHeader = React.memo(
  ({
    quizState,
    activeItems,
    usedItems,
    score,
    onPause,
    handleTimeUp,
    isSubmitting,
    isPaused,
    currentSurvivalDuration,
  }: QuizHeaderProps) => {
    const { gameMode, timeLimit, questionKey, timerResetKey, totalQuestions } = quizState;

    return (
      <>
        <div className="world-info-header-floating">World 1: 수리봉</div>

        <header className="quiz-header-rework">
          <div className="header-left-controls">
            <button className="pause-button" onClick={onPause} aria-label="일시정지">
              <svg
                className="pause-icon-svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="6" y="5" width="4" height="14" rx="1.5" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" />
              </svg>
              {gameMode === 'survival' && <span className="pause-count-badge">3</span>}
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
              {gameMode === 'survival' ? (
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
              <span className="score-unit">m</span>
            </div>
          </div>
        </header>
      </>
    );
  }
);

QuizHeader.displayName = 'QuizHeader';
