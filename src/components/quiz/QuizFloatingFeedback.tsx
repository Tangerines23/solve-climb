import React from 'react';
import { QuizAnimationState } from '../../types/quizProps';

interface QuizFloatingFeedbackProps {
  quizAnimations: QuizAnimationState;
  showExitConfirm: boolean;
  isFadingOut: boolean;
  setIsFadingOut: (value: boolean) => void;
  setShowExitConfirm: (value: boolean) => void;
  exitConfirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isExhausted: boolean;
}

export const QuizFloatingFeedback = React.memo(
  ({
    quizAnimations,
    showExitConfirm,
    isFadingOut,
    setIsFadingOut,
    setShowExitConfirm,
    exitConfirmTimeoutRef,
    isExhausted,
  }: QuizFloatingFeedbackProps) => {
    const { showSlideToast, toastValue, damagePosition } = quizAnimations;
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
            onClick={() => {
              if (exitConfirmTimeoutRef.current) {
                clearTimeout(exitConfirmTimeoutRef.current);
                exitConfirmTimeoutRef.current = null;
              }
              setIsFadingOut(true);
              setTimeout(() => {
                setShowExitConfirm(false);
                setIsFadingOut(false);
              }, 300);
            }}
          >
            <p className="exit-confirm-text">게임을 중단하시겠습니까?</p>
            <p className="exit-confirm-hint">한 번 더 누르면 나갑니다</p>
          </div>
        )}
      </>
    );
  }
);

QuizFloatingFeedback.displayName = 'QuizFloatingFeedback';
