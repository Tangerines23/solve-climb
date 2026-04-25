import React from 'react';
import { QwertyKeypad } from '../QwertyKeypad';
import { CustomKeypad } from '../CustomKeypad';
import { useQuiz } from '@/contexts/QuizContext';
import {
  CATEGORY_IDS,
  SUB_CATEGORY_IDS,
  QUIZ_INPUT_TYPES,
  KEYBOARD_TYPES,
  MATH_SUB_IDS,
} from '../../constants/ui';

export const QuizInputSection = React.memo(() => {
  const { quizState, quizHandlers, quizAnimations } = useQuiz();

  const { currentQuestion, categoryParam, subParam, useSystemKeyboard, keyboardType } = quizState;
  const { isSubmitting, isError, isPaused, isInputPaused } = quizAnimations;
  const {
    handleKeypadNumber,
    handleQwertyKeyPress,
    handleKeypadClear,
    handleKeypadBackspace,
    handleSubmit,
  } = quizHandlers;

  if (!currentQuestion) return null;

  // Determine effective input pause state
  const effectiveInputPaused = isInputPaused !== undefined ? isInputPaused : isPaused;

  const isJapaneseQuiz =
    categoryParam === CATEGORY_IDS.LANGUAGE && subParam === SUB_CATEGORY_IDS.JAPANESE;
  const forceSystemKeyboard =
    categoryParam === CATEGORY_IDS.GENERAL && typeof currentQuestion?.answer === 'string';
  const shouldUseSystemKeyboard = useSystemKeyboard || forceSystemKeyboard;

  const isEquationQuiz = categoryParam === CATEGORY_IDS.MATH && subParam === MATH_SUB_IDS.EQUATIONS;
  const isCalculusQuiz = categoryParam === CATEGORY_IDS.MATH && subParam === MATH_SUB_IDS.CALCULUS;
  const allowNegative = isEquationQuiz || isCalculusQuiz;

  if (shouldUseSystemKeyboard || currentQuestion.inputType === QUIZ_INPUT_TYPES.COORDINATE) {
    return null;
  }

  const isDisabled = isSubmitting || isError || effectiveInputPaused;

  return (
    <div className="keyboard-container">
      {isJapaneseQuiz ? (
        <QwertyKeypad
          onKeyPress={handleQwertyKeyPress}
          onClear={handleKeypadClear}
          onBackspace={handleKeypadBackspace}
          onSubmit={handleSubmit}
          disabled={isDisabled}
          mode="text"
        />
      ) : keyboardType === KEYBOARD_TYPES.QWERTY ? (
        <QwertyKeypad
          onKeyPress={handleQwertyKeyPress}
          onClear={handleKeypadClear}
          onBackspace={handleKeypadBackspace}
          onSubmit={handleSubmit}
          disabled={isDisabled}
          mode="number"
          allowNegative={allowNegative}
        />
      ) : (
        <CustomKeypad
          onNumberClick={handleKeypadNumber}
          onClear={handleKeypadClear}
          onBackspace={handleKeypadBackspace}
          onSubmit={handleSubmit}
          disabled={isDisabled}
          showNegative={allowNegative}
          showDecimal={currentQuestion?.inputType === QUIZ_INPUT_TYPES.DECIMAL}
          showFraction={currentQuestion?.inputType === QUIZ_INPUT_TYPES.FRACTION}
        />
      )}
    </div>
  );
});

QuizInputSection.displayName = 'QuizInputSection';
