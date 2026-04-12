import React, { useRef } from 'react';
import { QuizCard } from '@/components/QuizCard';
import { QuizModals } from '@/components/quiz/QuizModals';
import { TodaysPromise } from '@/components/quiz/TodaysPromise';
import { FeverEffect } from '@/components/effects/FeverEffect';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { LandmarkPopup } from '@/components/quiz/LandmarkPopup';
import { ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import {
  QuizDisplayState,
  QuizAnimationState,
  QuizHandlers,
  QuizModalHandlers,
} from '@/types/quizProps';
import { TutorialStep } from '@/components/tutorial/TutorialOverlay';
import { InventoryItem } from '@/types/user';

interface QuizLayoutProps {
  quizState: QuizDisplayState;
  quizAnimations: QuizAnimationState;
  quizHandlers: QuizHandlers;

  // Refs
  inputRef: React.RefObject<HTMLInputElement>;
  feedbackRef: React.RefObject<ItemFeedbackRef>;

  // Modal states & handlers (could be further grouped if needed, but keeping for now)
  modalState: {
    showLastChanceModal: boolean;
    showCountdown: boolean;
    showSafetyRope: boolean;
    showTipModal: boolean;
    showPauseModal: boolean;
    showStaminaModal: boolean;
    showTutorial: boolean;
    showPromise: boolean;
  };
  modalHandlers: QuizModalHandlers;

  // Other data
  inventory: InventoryItem[];
  minerals: number;
  isAnonymous: boolean;
  feverLevel: number;
  altitudePhase: string;
  promiseData: { rule: string; example: string };
  tutorialSteps: TutorialStep[];

  // Game Logic Props (Passed to QuizCard)
  activeItems: string[];
  usedItems: string[];
  score: number;
  isExhausted: boolean;
  handleTimeUp: () => void;

  // Setters (Internal state management from Page)
  setAnswerInput: (value: string) => void;
  setDisplayValue: (value: string) => void;
  setShowExitConfirm: (value: boolean) => void;
  setIsFadingOut: (value: boolean) => void;
}

export function QuizLayout({
  quizState,
  quizAnimations,
  quizHandlers,
  inputRef,
  feedbackRef,
  modalState,
  modalHandlers,
  inventory,
  minerals,
  isAnonymous,
  feverLevel,
  altitudePhase,
  promiseData,
  tutorialSteps,
  activeItems,
  usedItems,
  score,
  isExhausted,
  handleTimeUp,
  setAnswerInput,
  setDisplayValue,
  setShowExitConfirm,
  setIsFadingOut,
}: QuizLayoutProps) {
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    showLastChanceModal,
    showCountdown,
    showSafetyRope,
    showTipModal,
    showPauseModal,
    showStaminaModal,
    showTutorial,
    showPromise,
  } = modalState;

  const {
    handleRevive,
    handlePurchaseAndRevive,
    handleWatchAdAndRevive,
    handleGiveUp,
    handleCountdownComplete,
    setShowSafetyRope,
    handleBack,
    handleStartGame,
    handlePauseResume,
    handlePauseExit,
    setShowStaminaModal,
    onAlertAction,
    handlePromiseComplete,
    setShowTutorial,
  } = modalHandlers;

  const { categoryParam, subParam, levelParam, gameMode } = quizState;

  return (
    <div
      className={`quiz-page fever-level-${feverLevel}`}
      data-world={quizState.subParam || 'World1'}
      data-category={quizState.categoryParam || ''}
      data-altitude-phase={altitudePhase}
    >
      <QuizCard
        quizState={quizState}
        quizAnimations={quizAnimations}
        quizHandlers={quizHandlers}
        inputRef={inputRef}
        exitConfirmTimeoutRef={exitConfirmTimeoutRef}
        setAnswerInput={setAnswerInput}
        setDisplayValue={setDisplayValue}
        setShowExitConfirm={setShowExitConfirm}
        setIsFadingOut={setIsFadingOut}
        SURVIVAL_QUESTION_TIME={quizState.timeLimit}
        activeItems={activeItems}
        usedItems={usedItems}
        score={score}
        isExhausted={isExhausted}
        handleTimeUp={handleTimeUp}
      />

      <QuizModals
        feedbackRef={feedbackRef}
        showLastChanceModal={showLastChanceModal}
        gameMode={gameMode as 'time-attack' | 'survival'}
        inventory={inventory}
        minerals={minerals}
        handleRevive={handleRevive}
        handlePurchaseAndRevive={handlePurchaseAndRevive}
        handleWatchAdAndRevive={handleWatchAdAndRevive}
        handleGiveUp={handleGiveUp}
        showCountdown={showCountdown}
        handleCountdownComplete={handleCountdownComplete}
        showSafetyRope={showSafetyRope}
        setShowSafetyRope={setShowSafetyRope}
        categoryParam={categoryParam}
        subParam={subParam}
        levelParam={levelParam}
        showTipModal={showTipModal}
        handleBack={handleBack}
        handleStartGame={handleStartGame}
        showPauseModal={showPauseModal}
        remainingPauses={3}
        handlePauseClick={quizHandlers.onPause}
        handlePauseResume={handlePauseResume}
        handlePauseExit={handlePauseExit}
        showStaminaModal={showStaminaModal}
        setShowStaminaModal={setShowStaminaModal}
        isAnonymous={isAnonymous}
        onAlertAction={onAlertAction}
      />

      <TodaysPromise
        isVisible={showPromise}
        rule={promiseData.rule}
        example={promiseData.example}
        onComplete={handlePromiseComplete}
      />

      <FeverEffect />

      <TutorialOverlay
        isVisible={showTutorial}
        steps={tutorialSteps}
        onComplete={() => setShowTutorial(false)}
      />

      <LandmarkPopup activeLandmark={quizState.activeLandmark} />
    </div>
  );
}
