import React from 'react';
import { CoordinateGrid } from './CoordinateGrid';
import { QuizDisplayState, QuizAnimationState } from '../../types/quizProps';

interface QuizAnswerAreaProps {
  quizState: QuizDisplayState;
  quizAnimations: QuizAnimationState;
  inputRef: React.RefObject<HTMLInputElement>;
  setAnswerInput: (value: string) => void;
  setDisplayValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  effectiveInputPaused: boolean;
}

export const QuizAnswerArea = React.memo(
  ({
    quizState,
    quizAnimations,
    inputRef,
    setAnswerInput,
    setDisplayValue,
    handleSubmit,
    effectiveInputPaused,
  }: QuizAnswerAreaProps) => {
    const { currentQuestion, answerInput, displayValue, levelParam } = quizState;
    const { isSubmitting, isError, inputAnimation, showFlash } = quizAnimations;

    if (!currentQuestion) return null;

    const isJapaneseQuiz =
      quizState.categoryParam === 'language' && quizState.subParam === 'japanese';
    const forceSystemKeyboard =
      quizState.categoryParam === 'general' && typeof currentQuestion?.answer === 'string';
    const shouldUseSystemKeyboard = quizState.useSystemKeyboard || forceSystemKeyboard;

    const isEquationQuiz = quizState.categoryParam === 'math' && quizState.subParam === 'equations';
    const isCalculusQuiz = quizState.categoryParam === 'math' && quizState.subParam === 'calculus';
    const allowNegative = isEquationQuiz || isCalculusQuiz;

    return (
      <div className="quiz-answer-section">
        {currentQuestion.inputType === 'coordinate' ? (
          <div className="coordinate-mini-game-wrapper">
            <CoordinateGrid
              onShoot={(x, y) => {
                setAnswerInput(`${x},${y}`);
                setDisplayValue(`${x},${y}`);
                setTimeout(() => {
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  handleSubmit(fakeEvent);
                }, 300);
              }}
              isFirstQuadrantOnly={levelParam === 1}
              disabled={isSubmitting || isError || effectiveInputPaused}
            />
          </div>
        ) : shouldUseSystemKeyboard ? (
          <>
            <div className={`answer-input-wrapper ${isError ? 'is-error' : ''}`}>
              <input
                ref={inputRef}
                type={isJapaneseQuiz || forceSystemKeyboard ? 'text' : 'text'}
                inputMode={isJapaneseQuiz ? 'text' : forceSystemKeyboard ? 'text' : 'numeric'}
                value={isError ? displayValue : answerInput}
                onChange={(e) => {
                  if (isError || isSubmitting || effectiveInputPaused) return;

                  const value = e.target.value;

                  if (isJapaneseQuiz) {
                    const filtered = value.replace(/[^a-zA-Z]/g, '').slice(0, 20);
                    setAnswerInput(filtered);
                    setDisplayValue(filtered);
                  } else if (forceSystemKeyboard) {
                    const truncated = value.slice(0, 10);
                    setAnswerInput(truncated);
                    setDisplayValue(truncated);
                  } else {
                    if (allowNegative) {
                      let newValue = value.replace(/[^0-9-]/g, '');
                      if (newValue.includes('-') && newValue.indexOf('-') !== 0) {
                        newValue = newValue.replace(/-/g, '');
                        newValue = '-' + newValue;
                      }
                      const minusCount = (newValue.match(/-/g) || []).length;
                      if (minusCount > 1) {
                        newValue = '-' + newValue.replace(/-/g, '');
                      }
                      const truncated = newValue.slice(0, 6);
                      setAnswerInput(truncated);
                      setDisplayValue(truncated);
                    } else {
                      const newValue = value.replace(/[^0-9]/g, '');
                      const truncated = newValue.slice(0, 6);
                      setAnswerInput(truncated);
                      setDisplayValue(truncated);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isError && !effectiveInputPaused && !isSubmitting) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                onClick={() => {
                  if (inputRef.current && !isSubmitting && !isError) {
                    inputRef.current.focus();
                  }
                }}
                placeholder={isJapaneseQuiz ? '로마지 입력 (예: a, ki)' : '정답 입력'}
                className={`input-base answer-input-field answer-input-system ${inputAnimation} ${isError ? 'error-state is-error' : ''} ${showFlash ? 'input-error-flash' : ''}`}
                disabled={(isSubmitting && !isError) || effectiveInputPaused}
                readOnly={isError}
                autoFocus={false}
              />
            </div>
            <button
              type="submit"
              className="btn-base btn-primary submit-button-system"
              disabled={isSubmitting || !answerInput || isError || effectiveInputPaused}
              onClick={(e) => {
                e.preventDefault();
                if (!isError && !effectiveInputPaused && !isSubmitting) {
                  handleSubmit(e);
                }
              }}
            >
              제출
            </button>
          </>
        ) : (
          <div
            className={`answer-input-wrapper ${isError ? 'is-error' : ''}`}
            data-vg-ignore="true"
          >
            <div
              className={`answer-display ${inputAnimation} ${isError ? 'is-error' : ''} ${showFlash ? 'input-error-flash' : ''}`}
            >
              <div className="answer-content-container">
                <span className="answer-display-text">
                  {(isError ? displayValue : answerInput) || ' '}
                </span>
                {!isError && <div className="answer-caret"></div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

QuizAnswerArea.displayName = 'QuizAnswerArea';
