// src/pages/MathQuizPage.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  useRef,
} from 'react';
import './MathQuizPage.css'; // v3.0 9단계에서 생성한 CSS

// (v3.0 14단계) @toss/tds-mobile 의존성 완전 제거

// (v3.0 13단계) @apps-in-toss/web-framework 의존성 제거

import { generateRandomNumber } from '../utils/math';
import { useQuizStore, Difficulty } from '../stores/useQuizStore';
import { MESSAGES } from '../constants/messages';
import {
  SCORE_PER_CORRECT,
  MAX_POSSIBLE_ANSWER,
} from '../constants/game';
import { SUBMIT_DELAY_MS } from '../constants/layout';

type InputHandle = HTMLInputElement;

// (v3.0 13단계) 피드백 메시지 타입 정의
type Feedback = {
  message: string;
  type: 'success' | 'error' | 'idle';
};

export function MathQuizPage() {
  // (v3.0 13단계) useToast() 제거
  const { difficulty, increaseScore } = useQuizStore();

  // (v3.0 12단계) useTheme() 훅 제거

  const [question, setQuestion] = useState({ x: 0, y: 0 });
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<InputHandle>(null);

  // (v3.0 13단계) 피드백 상태
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

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);

      const answer = parseInt(answerInput, 10);
      if (isNaN(answer)) {
        setFeedback({ message: MESSAGES.INVALID_INPUT, type: 'error' }); // (13단계) useState로 변경
        inputRef.current?.focus();
        setIsSubmitting(false);
        return;
      }

      if (answer < 0 || answer > MAX_POSSIBLE_ANSWER) {
        setFeedback({ message: MESSAGES.OUT_OF_RANGE, type: 'error' }); // (13단계) useState로 변경
        inputRef.current?.focus();
        setIsSubmitting(false);
        return;
      }

      const isCorrect = question.x + question.y === answer;

      setTimeout(() => {
        if (isCorrect) {
          setFeedback({ message: MESSAGES.CORRECT, type: 'success' }); // (13단계) useState로 변경
          increaseScore(SCORE_PER_CORRECT);

          setTimeout(() => {
            generateNewQuestion();
            setFeedback({ message: '', type: 'idle' });
          }, SUBMIT_DELAY_MS);

        } else {
          setFeedback({ message: MESSAGES.INCORRECT, type: 'error' }); // (13단계) useState로 변경
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
   * (v3.0 14단계) 순수 HTML/CSS
   */
  return (
    // <Page> 대신 <div>
    <div className="page-container">
      <div className="quiz-container">
        {/* <Card> 대신 <div> */}
        <div className="quiz-card">
          <form onSubmit={handleSubmit}>
            <div className="quiz-form-content">
              {/* <Text> 대신 <h2> */}
              <h2 className="problem-text">
                {question.x} + {question.y} = ?
              </h2>

              {/* <Input> 대신 <input> */}
              <input
                ref={inputRef}
                value={answerInput}
                onChange={handleInputChange}
                placeholder="정답을 입력하세요"
                inputMode="numeric"
                className="answer-input"
              />

              {/* <Button> 대신 <button> */}
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || feedback.type === 'success'}
              >
                {isSubmitting ? MESSAGES.SUBMITTING : MESSAGES.SUBMIT}
              </button>

              {/* (v3.0 13단계) 피드백 메시지 영역 (순수 HTML) */}
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
