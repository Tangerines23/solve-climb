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
import { Timer } from '../components/Timer';

type GameMode = 'time-attack' | 'survival';
type InputHandle = HTMLInputElement;

export function MathQuizPage() {
  const { score, difficulty, increaseScore, resetQuiz } = useQuizStore();
  const navigate = useNavigate(); // useNavigate hook

  const [gameMode] = useState<GameMode>('time-attack');
  const [isGameOver, setIsGameOver] = useState(false); // Game over state

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

  const renderGameOver = () => (
    <div className="quiz-form-content">
      <h2 className="problem-text">Time's Up!</h2>
      <p style={{ textAlign: 'center', fontSize: '1.2rem', margin: '20px 0' }}>
        Your final score is:
      </p>
      <p style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 'bold', color: '#0070f3', margin: 0 }}>
        {score}
      </p>
      <button onClick={handleNavigateToResult} className="submit-button" style={{ marginTop: '20px' }}>
        Confirm
      </button>
    </div>
  );

  const renderQuiz = () => (
    <form onSubmit={handleSubmit}>
      <div className="quiz-form-content">
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
      </div>
    </form>
  );

  return (
    <div className="page-container">
      {gameMode === 'time-attack' && (
        <Timer initialTime={30} onGameOver={handleGameOver} isPaused={isGameOver} />
      )}
      <div className={`score-display ${scoreAnimation}`}>Score: {score}</div>
      <div className={`quiz-card ${cardAnimation}`}>
        {isGameOver ? renderGameOver() : renderQuiz()}
      </div>
    </div>
  );
}