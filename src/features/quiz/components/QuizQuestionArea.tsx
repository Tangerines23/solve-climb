import React from 'react';
import { FunctionMachineHint, IntegralTankHint, CalculusHint } from '../types/quiz';
import { EquationVisualizer } from './algebra/EquationVisualizer';
import { FunctionMachine } from './expert/FunctionMachine';
import { IntegralVisualizer } from './expert/IntegralVisualizer';
import { CalculusVisualization } from './CalculusVisualization';
import { ReasoningOverlay } from './effects/ReasoningOverlay';
import { useQuiz } from '../contexts/QuizContext';
import { useAlgebra } from '../hooks/core/useAlgebra';

export const QuizQuestionArea = React.memo(() => {
  const { quizState, quizAnimations } = useQuiz();
  const { parseEquation } = useAlgebra();
  const { currentQuestion, categoryParam, levelParam, showAnswer } = quizState;
  const { cardAnimation, questionAnimation } = quizAnimations;

  if (!currentQuestion) return null;

  return (
    <div className="question-area-content" data-vg-ignore="true">
      <div className="contents-display">
        <ReasoningOverlay
          isVisible={
            categoryParam === '논리' && levelParam !== null && levelParam >= 6 && levelParam <= 10
          }
          isCorrect={cardAnimation === 'correct-flash'}
        />
        <div className={questionAnimation}>
          <h2
            className={`problem-text ${
              currentQuestion.hintType === 'transposition' ||
              currentQuestion.hintType === 'function-machine'
                ? 'problem-hidden'
                : 'problem-visible'
            }`}
          >
            {currentQuestion.question}
          </h2>
          {currentQuestion.hintType === 'transposition' && (
            <div className="visualizer-container">
              <EquationVisualizer
                initialLeft={parseEquation(currentQuestion.question).left}
                initialRight={parseEquation(currentQuestion.question).right}
              />
            </div>
          )}
          {currentQuestion.hintType === 'function-machine' && currentQuestion.hintData && (
            <div className="visualizer-container">
              <FunctionMachine
                type={(currentQuestion.hintData as FunctionMachineHint).type}
                value={(currentQuestion.hintData as FunctionMachineHint).value}
                input={(currentQuestion.hintData as FunctionMachineHint).input}
              />
            </div>
          )}
          {currentQuestion.hintType === 'integral-tank' && currentQuestion.hintData && (
            <IntegralVisualizer hintData={currentQuestion.hintData as IntegralTankHint} />
          )}
          {currentQuestion.hintType === 'calculus' && currentQuestion.hintData && (
            <CalculusVisualization
              type={(currentQuestion.hintData as CalculusHint).type}
              func={(currentQuestion.hintData as CalculusHint).func}
            />
          )}
          {showAnswer && (
            <div className="debug-answer-display">
              정답: <strong>{currentQuestion.answer}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

QuizQuestionArea.displayName = 'QuizQuestionArea';
