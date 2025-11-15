// src/pages/MathQuizPage.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  useRef,
} from 'react';
import './MathQuizPage.css'; // v3.0 9단계에서 생성한 CSS

// (v3.0 17단계) 'AI 사진관'/'TDS 문서'에서 '존재'가 확인된 컴포넌트만 import
// import {
//   Button,
// } from '@toss/tds-mobile';

// (v3.0 17단계) @apps-in-toss/web-framework 의존성 제거 (useToast 없음)

import { generateRandomNumber } from '../utils/math';
import { useQuizStore, Difficulty } from '../stores/useQuizStore';
import { MESSAGES } from '../constants/messages';
import {
  SCORE_PER_CORRECT,
  MAX_POSSIBLE_ANSWER,
} from '../constants/game';
import { SUBMIT_DELAY_MS } from '../constants/layout';

type InputHandle = HTMLInputElement;

type Feedback = {
  message: string;
  type: 'success' | 'error' | 'idle';
};

export function MathQuizPage() {
  // (v3.0 17단계) '존재'하지 않는 훅(useToast, useTheme) 제거
  const { difficulty, increaseScore } = useQuizStore();

  const [question, setQuestion] = useState({ x: 0, y: 0 });
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<InputHandle>(null);

  const [feedback, setFeedback] = useState<Feedback>({ message: '', type: 'idle' });

  const generateNewQuestion = useCallback(() => {
    const newX = generateRandomNumber(difficulty as Difficulty);
    const newY = generateRandomNumber(difficulty as Difficulty);
    setQuestion({ x: newX, y: newY });
    setAnswerInput('');
    inputRef.current?.focus();
  }, [difficulty]);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  // (v3.0 17단계) useToast 대신 useState 피드백 사용
  const openFeedback = (options: { message: string; type: 'success' | 'error' }) => {
    if (options.type === 'error') {
      console.error(options.message);
    } else {
      console.log(options.message);
    }
    setFeedback({ message: options.message, type: options.type });
  };

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);

      const answer = parseInt(answerInput, 10);
      if (isNaN(answer)) {
        openFeedback({ message: MESSAGES.INVALID_INPUT, type: 'error' });
        inputRef.current?.focus();
        setIsSubmitting(false);
        return;
      }

      if (answer < 0 || answer > MAX_POSSIBLE_ANSWER) {
        openFeedback({ message: MESSAGES.OUT_OF_RANGE, type: 'error' });
        inputRef.current?.focus();
        setIsSubmitting(false);
        return;
      }

      const isCorrect = question.x + question.y === answer;

      setTimeout(() => {
        if (isCorrect) {
          openFeedback({ message: MESSAGES.CORRECT, type: 'success' });
          increaseScore(SCORE_PER_CORRECT);

          setTimeout(() => {
            generateNewQuestion();
            setFeedback({ message: '', type: 'idle' });
          }, SUBMIT_DELAY_MS);

        } else {
          openFeedback({ message: MESSAGES.INCORRECT, type: 'error' });
          setAnswerInput('');
          inputRef.current?.focus();
        }
        setIsSubmitting(false);
      }, SUBMIT_DELAY_MS);
    },
    [answerInput, generateNewQuestion, increaseScore, isSubmitting, question]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswerInput(e.target.value);
    if (feedback.type === 'error') {
      setFeedback({ message: '', type: 'idle' });
    }
  };

  /**
   * (v3.0 17단계) 'AI 사진관' 예제 방식 (TDS Button + 순수 HTML/CSS)
   */
  return (
    // <Page> 컴포넌트는 TDS에 없으므로 <div>로 대체
    <div className="page-container">
      <div className="quiz-container">
        {/* <Card> 컴포넌트는 TDS에 없으므로 <div>로 대체 */}
        <div className="quiz-card">
          <form onSubmit={handleSubmit}>
            <div className="quiz-form-content">
              {/* <Text> 컴포넌트는 TDS에 없으므로 <h2>로 대체 */}
              <h2 className="problem-text">
                {question.x} + {question.y} = ?
              </h2>

              {/* <Input> 컴포넌트는 TDS에 없으므로 <input>으로 대체 */}
              <input
                ref={inputRef}
                value={answerInput}
                onChange={handleInputChange}
                placeholder="정답을 입력하세요"
                inputMode="numeric"
                className="answer-input"
              />

              {/* (v3.0 17단계) <Spacing> 컴포넌트 제거 (CSS gap으로 대체됨) */}

              {/* <Button> (TDS 컴포넌트 사용) */}
              <button
                type="submit"
                className="submit-button"
                style={{ width: '100%' }}
                disabled={isSubmitting || feedback.type === 'success'}
              >
                {isSubmitting ? MESSAGES.SUBMITTING : MESSAGES.SUBMIT}
              </button>

              {/* 피드백 메시지 영역 (순수 HTML) */}
              <p className={`feedback-message ${feedback.type}`}>
                {feedback.message}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}