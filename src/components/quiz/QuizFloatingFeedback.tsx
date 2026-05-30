import React from 'react';
import { useQuiz } from '@/contexts/QuizContext';

export const QuizFloatingFeedback = React.memo(() => {
  const { quizAnimations, isExhausted, cancelExitConfirm } = useQuiz();

  const { showSlideToast, toastValue, damagePosition, showExitConfirm, isFadingOut } =
    quizAnimations;
  const isPositiveToast = toastValue.startsWith('+');

  return (
    <>
      {showSlideToast && (
        <div
          className={`slide-toast ${isPositiveToast ? 'is-positive' : ''}`}
          style={
            {
              '--toast-left': damagePosition.left,
              '--toast-top': damagePosition.top,
            } as React.CSSProperties
          }
        >
          <span
            className={`slide-toast-text ${isPositiveToast ? 'is-positive' : ''} ${isExhausted && isPositiveToast ? 'is-exhausted' : ''}`}
          >
            {toastValue}
          </span>
        </div>
      )}

      {showExitConfirm && (
        <div
          className={`exit-confirm-toast ${isFadingOut ? 'fade-out' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            cancelExitConfirm();
          }}
        >
          <p className="exit-confirm-text">게임을 중단하시겠습니까?</p>
          <p className="exit-confirm-hint">한 번 더 누르면 나갑니다</p>
        </div>
      )}
    </>
  );
});

QuizFloatingFeedback.displayName = 'QuizFloatingFeedback';
