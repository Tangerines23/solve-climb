import React from 'react';
import { useQuiz } from '../contexts/QuizContext';

// 퀴즈 피드백 토스트 (카드 내부에 위치해야 하므로 쪼갬)
export const QuizFloatingFeedback = React.memo(() => {
  const { quizAnimations, isExhausted } = useQuiz();
  const { showSlideToast, toastValue, damagePosition } = quizAnimations;
  const isPositiveToast = toastValue.startsWith('+');

  if (!showSlideToast) return null;

  return (
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
  );
});

QuizFloatingFeedback.displayName = 'QuizFloatingFeedback';

// 게임 중단 확인 토스트 (뷰포트 fixed 위치에 고정되어야 하므로 따로 분리)
export const QuizExitConfirm = React.memo(() => {
  const { quizAnimations, cancelExitConfirm } = useQuiz();
  const { showExitConfirm, isFadingOut } = quizAnimations;

  if (!showExitConfirm) return null;

  return (
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
  );
});

QuizExitConfirm.displayName = 'QuizExitConfirm';
