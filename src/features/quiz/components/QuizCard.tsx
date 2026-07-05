import React from 'react';
import { QuizHeader } from './QuizHeader';
import { QuizQuestionArea } from './QuizQuestionArea';
import { QuizAnswerArea } from './QuizAnswerArea';
import { QuizFloatingFeedback, QuizExitConfirm } from './QuizFloatingFeedback';
import { QuizInputSection } from './QuizInputSection';
import { UI_MESSAGES } from '@/constants/ui';
import { useQuiz } from '../contexts/QuizContext';

function QuizCardComponent() {
  const { quizState, quizAnimations } = useQuiz();

  const { currentQuestion } = quizState;

  // 데이터 부족 시 로딩 반환
  if (!currentQuestion) {
    if (quizState.categoryParam && quizState.subParam) {
      return (
        <div className="quiz-page">
          <div className="quiz-loading">
            <div className="loading-spinner" />
            <span>{UI_MESSAGES.GENERATING_QUESTIONS}</span>
          </div>
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
          {quizState.category} · {worldName}
        </div>
        <div className={`quiz-card ${quizAnimations.cardAnimation}`} data-vg-ignore="true">
          <div className="quiz-content-inner">
            <div className="question-answer-group">
              <QuizQuestionArea />
              <QuizAnswerArea />
            </div>
          </div>
          {/* 퀴즈 피드백 토스트가 퀴즈카드 영역 내부에서만 나타나도록 카드 내부 배치 */}
          <QuizFloatingFeedback />
        </div>

        {/* 중단 확인 토스트는 전체 화면(fixed)에 렌더링 */}
        <QuizExitConfirm />
        <QuizInputSection />
      </div>
    </>
  );
}

export const QuizCard = React.memo(QuizCardComponent);
