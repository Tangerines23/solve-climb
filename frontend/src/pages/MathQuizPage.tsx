// src/pages/MathQuizPage.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate import
import './MathQuizPage.css';
import { useQuizStore, Difficulty } from '../stores/useQuizStore';
import { generateRandomNumber } from '../utils/math';
import { MESSAGES } from '../constants/messages';
import { SCORE_PER_CORRECT, MAX_POSSIBLE_ANSWER } from '../constants/game';
import { TimerCircle } from '../components/TimerCircle';

type GameMode = 'time-attack' | 'survival';
type InputHandle = HTMLInputElement;

export function MathQuizPage() {
  const { score, difficulty, increaseScore, resetQuiz } = useQuizStore();
  const navigate = useNavigate(); // useNavigate hook

  const [gameMode] = useState<GameMode>('time-attack');
  const [isGameOver, setIsGameOver] = useState(false); // Game over state
  const [category, setCategory] = useState('신용 짤짝 퀴즈');

  const [question, setQuestion] = useState({ x: 0, y: 0 });
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<InputHandle>(null);

  // Animation states
  const [cardAnimation, setCardAnimation] = useState('');
  const [inputAnimation, setInputAnimation] = useState('');
  const [scoreAnimation, setScoreAnimation] = useState('');
  const [questionAnimation, setQuestionAnimation] = useState('fade-in');

  const generateNewQuestion = useCallback(() => {
    setQuestionAnimation('fade-out');
    setTimeout(() => {
      const newX = generateRandomNumber(difficulty as Difficulty);
      const newY = generateRandomNumber(difficulty as Difficulty);
      setQuestion({ x: newX, y: newY });
      setAnswerInput('');
      inputRef.current?.focus();
      setQuestionAnimation('fade-in');
    }, 150);
  }, [difficulty]);

  useEffect(() => {
    resetQuiz(); // Reset score when component mounts
    generateNewQuestion();
  }, [generateNewQuestion, resetQuiz]);

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const handleNavigateToResult = () => {
    navigate('/result');
  };

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting || isGameOver) return;

      const answer = parseInt(answerInput, 10);
      if (isNaN(answer) || answer < 0 || answer > MAX_POSSIBLE_ANSWER) {
        setCardAnimation('wrong-shake');
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => setCardAnimation(''), 150);
        return;
      }

      setIsSubmitting(true);
      const isCorrect = question.x + question.y === answer;

      if (isCorrect) {
        setInputAnimation('correct-flash');
        setScoreAnimation('score-pop');
        increaseScore(SCORE_PER_CORRECT);
        
        setTimeout(() => {
          generateNewQuestion();
          setInputAnimation('');
          setScoreAnimation('');
          setIsSubmitting(false);
        }, 150);
      } else {
        setCardAnimation('wrong-shake');
        if (navigator.vibrate) navigator.vibrate(200);
        
        setTimeout(() => {
          generateNewQuestion();
          setCardAnimation('');
          setIsSubmitting(false);
        }, 150);
      }
    },
    [answerInput, generateNewQuestion, increaseScore, isSubmitting, isGameOver, question]
  );

  const renderGameOverCard = () => (
    <div className={`quiz-card result-mode ${cardAnimation}`}>
      <h2 className="result-title">시간 종료!</h2>
      <p className="result-score-label">최종 점수:</p>
      <p className="result-score">{score}</p>
      <button 
        onClick={handleNavigateToResult} 
        className="submit-button result-confirm-button"
      >
        확인
      </button>
    </div>
  );

  const renderQuizCard = () => (
    <div className={`quiz-card ${cardAnimation}`}>
      <TimerCircle duration={2} onComplete={handleGameOver} isPaused={isGameOver} />
      <div className="category-label">{category}</div>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <div className={questionAnimation}>
          <h2 className="problem-text">
            {question.x} + {question.y} = ?
          </h2>
        </div>
        <input
          ref={inputRef}
          value={answerInput}
          onChange={(e) => setAnswerInput(e.target.value)}
          placeholder="정답"
          inputMode="numeric"
          className={`answer-input ${inputAnimation}`}
          disabled={isSubmitting}
        />
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {MESSAGES.SUBMIT}
        </button>
      </form>
    </div>
  );

  return (
    <div className="page-container">
      {isGameOver ? renderGameOverCard() : renderQuizCard()}
    </div>
  );
}
