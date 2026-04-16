import React from 'react';
import { QwertyKeypad } from '../QwertyKeypad';
import { CustomKeypad } from '../CustomKeypad';
import { QuizDisplayState, QuizHandlers } from '../../types/quizProps';

interface QuizInputSectionProps {
  quizState: QuizDisplayState;
  quizHandlers: QuizHandlers;
  effectiveInputPaused: boolean;
  allowNegative: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  isError: boolean;
  isSubmitting: boolean;
}

export const QuizInputSection = React.memo(
  ({
    quizState,
    quizHandlers,
    effectiveInputPaused,
    allowNegative,
    handleSubmit,
    isError,
    isSubmitting,
  }: QuizInputSectionProps) => {
    const { currentQuestion, categoryParam, subParam, useSystemKeyboard, keyboardType } = quizState;
    const { handleKeypadNumber, handleQwertyKeyPress, handleKeypadClear, handleKeypadBackspace } =
      quizHandlers;

    if (!currentQuestion) return null;

    const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
    const forceSystemKeyboard =
      categoryParam === 'general' && typeof currentQuestion?.answer === 'string';
    const shouldUseSystemKeyboard = useSystemKeyboard || forceSystemKeyboard;

    if (shouldUseSystemKeyboard || currentQuestion.inputType === 'coordinate') {
      return null;
    }

    return (
      <div className="keyboard-container">
        {isJapaneseQuiz ? (
          <QwertyKeypad
            onKeyPress={handleQwertyKeyPress}
            onClear={handleKeypadClear}
            onBackspace={handleKeypadBackspace}
            onSubmit={handleSubmit}
            disabled={isSubmitting || isError || effectiveInputPaused}
            mode="text"
          />
        ) : keyboardType === 'qwerty' ? (
          <QwertyKeypad
            onKeyPress={handleQwertyKeyPress}
            onClear={handleKeypadClear}
            onBackspace={handleKeypadBackspace}
            onSubmit={handleSubmit}
            disabled={isSubmitting || isError || effectiveInputPaused}
            mode="number"
            allowNegative={allowNegative}
          />
        ) : (
          <CustomKeypad
            onNumberClick={handleKeypadNumber}
            onClear={handleKeypadClear}
            onBackspace={handleKeypadBackspace}
            onSubmit={handleSubmit}
            disabled={isSubmitting || isError || effectiveInputPaused}
            showNegative={allowNegative}
            showDecimal={currentQuestion?.inputType === 'decimal'}
            showFraction={currentQuestion?.inputType === 'fraction'}
          />
        )}
      </div>
    );
  }
);

QuizInputSection.displayName = 'QuizInputSection';
