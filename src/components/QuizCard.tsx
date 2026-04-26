// 퀴즈 카드 컴포넌트
import React from 'react';
import { QuizHeader } from './quiz/QuizHeader';
import { QuizQuestionArea } from './quiz/QuizQuestionArea';
import { QuizAnswerArea } from './quiz/QuizAnswerArea';
import { QuizFloatingFeedback } from './quiz/QuizFloatingFeedback';
import { QuizInputSection } from './quiz/QuizInputSection';
import { UI_MESSAGES } from '../constants/ui';
import { useQuiz } from '@/contexts/QuizContext';

function QuizCardComponent() {
  const { quizState, quizAnimations } = useQuiz();

  const { currentQuestion } = quizState;

  // 데이터 부족 시 로딩 반환
  if (!currentQuestion) {
    if (quizState.categoryParam && quizState.subParam) {
      return (
        <div className="quiz-page">
          <div className="quiz-loading">{UI_MESSAGES.GENERATING_QUESTIONS}</div>
        </div>
      );
    }
    return null;
  }

  const worldName = quizState.worldParam
    ? (UI_MESSAGES.WORLD_NAMES as any)[quizState.worldParam] || UI_MESSAGES.WORLD_1_NAME
    : UI_MESSAGES.WORLD_1_NAME;

  return (
    <>
      <QuizHeader />

      <div className="quiz-content">
        <div className="world-info-header-floating">
          {quizState.category} - {worldName}
        </div>
        <div className={`quiz-card ${quizAnimations.cardAnimation}`} data-vg-ignore="true">
          <div className="quiz-content-inner">
            <div className="question-answer-group">
              <QuizQuestionArea />
              <QuizAnswerArea />
            </div>
          </div>

          <QuizFloatingFeedback />
        </div>

        <QuizInputSection />
      </div>
    </>
  );
}

export const QuizCard = React.memo(QuizCardComponent);
