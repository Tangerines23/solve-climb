// 퀴즈 카드 컴포넌트
import React from 'react';
import { useGameStore } from '../stores/useGameStore';
import { QuizDisplayState, QuizAnimationState, QuizHandlers } from '../types/quizProps';
import { QuizHeader } from './quiz/QuizHeader';
import { QuizQuestionArea } from './quiz/QuizQuestionArea';
import { QuizAnswerArea } from './quiz/QuizAnswerArea';
import { QuizFloatingFeedback } from './quiz/QuizFloatingFeedback';
import { QuizInputSection } from './quiz/QuizInputSection';

interface QuizCardProps {
  quizState: QuizDisplayState;
  quizAnimations: QuizAnimationState;
  quizHandlers: QuizHandlers;

  // Persistence/Refs
  inputRef: React.RefObject<HTMLInputElement>;
  exitConfirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;

  // Setters
  setAnswerInput: (value: string) => void;
  setDisplayValue: (value: string) => void;
  setShowExitConfirm: (value: boolean) => void;
  setIsFadingOut: (value: boolean) => void;

  // Constants
  SURVIVAL_QUESTION_TIME: number;
}

function QuizCardComponent({
  quizState,
  quizAnimations,
  quizHandlers,
  inputRef,
  exitConfirmTimeoutRef,
  setAnswerInput,
  setDisplayValue,
  setShowExitConfirm,
  setIsFadingOut,
  SURVIVAL_QUESTION_TIME,
}: QuizCardProps) {
  const { currentQuestion, gameMode, lives } = quizState;

  const { isSubmitting, isError, isPaused, isInputPaused, showExitConfirm, isFadingOut } =
    quizAnimations;

  const {
    onSafetyRopeUsed,
    onLastSpurt,
    onPause,
    generateNewQuestion,
    handleSubmit,
    handleGameOver,
  } = quizHandlers;

  // Determine effective input pause state
  const effectiveInputPaused = isInputPaused !== undefined ? isInputPaused : isPaused;

  const isEquationQuiz = quizState.categoryParam === 'math' && quizState.subParam === 'equations';
  const isCalculusQuiz = quizState.categoryParam === 'math' && quizState.subParam === 'calculus';
  const allowNegative = isEquationQuiz || isCalculusQuiz;

  const { activeItems, consumeActiveItem, consumeLife, isExhausted, usedItems } = useGameStore();

  const handleTimeUp = () => {
    const hasSafetyRope = activeItems.includes('safety_rope');
    const hasLastSpurt = gameMode === 'time-attack' && activeItems.includes('last_spurt');

    if (hasSafetyRope) {
      consumeActiveItem('safety_rope');
      console.log('[Game] Safety Rope used! Saved from time up.');
      if (onSafetyRopeUsed) onSafetyRopeUsed();
    } else if (hasLastSpurt) {
      consumeActiveItem('last_spurt');
      console.log('[Game] Last Spurt used! Time extended.');
      if (onLastSpurt) onLastSpurt();
    } else if (gameMode === 'survival') {
      const hasFlare = activeItems.includes('flare');
      if (hasFlare) {
        consumeActiveItem('flare');
        console.log('[Game] Flare used! Revived from time up.');
        generateNewQuestion();
      } else if (lives > 1) {
        consumeLife();
        generateNewQuestion();
      } else {
        consumeLife();
        handleGameOver('timeout');
      }
    } else {
      handleGameOver('timeout');
    }
  };

  // 데이터 부족 시 로딩 반환
  if (!currentQuestion) {
    if (quizState.categoryParam && quizState.subParam) {
      return (
        <div className="quiz-page">
          <div className="quiz-loading">문제를 생성하는 중...</div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <QuizHeader
        quizState={quizState}
        activeItems={activeItems}
        usedItems={usedItems}
        onPause={onPause}
        handleTimeUp={handleTimeUp}
        isSubmitting={isSubmitting}
        isPaused={isPaused}
        currentSurvivalDuration={SURVIVAL_QUESTION_TIME}
      />

      <div className="quiz-content">
        <QuizQuestionArea quizState={quizState} quizAnimations={quizAnimations} />

        <QuizAnswerArea
          quizState={quizState}
          quizAnimations={quizAnimations}
          inputRef={inputRef}
          setAnswerInput={setAnswerInput}
          setDisplayValue={setDisplayValue}
          handleSubmit={handleSubmit}
          effectiveInputPaused={effectiveInputPaused}
        />

        <QuizFloatingFeedback
          quizAnimations={quizAnimations}
          showExitConfirm={showExitConfirm}
          isFadingOut={isFadingOut}
          setIsFadingOut={setIsFadingOut}
          setShowExitConfirm={setShowExitConfirm}
          exitConfirmTimeoutRef={exitConfirmTimeoutRef}
          isExhausted={isExhausted}
        />

        <QuizInputSection
          quizState={quizState}
          quizHandlers={quizHandlers}
          effectiveInputPaused={effectiveInputPaused}
          allowNegative={allowNegative}
          handleSubmit={handleSubmit}
          isError={isError}
          isSubmitting={isSubmitting}
        />
      </div>
    </>
  );
}

// React.memo로 메모이제이션 - props가 변경되지 않으면 리렌더링 방지
export const QuizCard = React.memo(QuizCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.quizState === nextProps.quizState &&
    prevProps.quizAnimations === nextProps.quizAnimations &&
    prevProps.quizHandlers === nextProps.quizHandlers &&
    prevProps.SURVIVAL_QUESTION_TIME === nextProps.SURVIVAL_QUESTION_TIME
  );
});
