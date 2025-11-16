# 🎯 AI 컨텍스트: 프로젝트 파일

---
## 필수 파일

### `src/pages/MathQuizPage.tsx`

```tsx
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

```

### `src/pages/MathQuizPage.css`

```css
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
  padding: 0 8px; /* Add some padding */
}

.timer-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  /* Timer component will be centered here */
}

/* Score display */
.score-display {
  font-size: 1.2rem; /* Reduced size */
  font-weight: bold;
  color: white; /* Changed color for dark theme */
  transition: transform 0.15s ease-in-out;
}

/* --- Animations --- */

/* Correct answer flash on INPUT (for light background) */
@keyframes correct-flash-animation {
  50% { background-color: #c8e6c9; border-color: #4caf50; }
}
.correct-flash {
  animation: correct-flash-animation 0.15s ease-in-out;
}

/* Incorrect answer shake on CARD */
@keyframes wrong-shake-animation {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.wrong-shake {
  animation: wrong-shake-animation 0.15s ease-in-out;
}

/* Score pop animation */
@keyframes score-pop-animation {
  50% { transform: scale(1.3); }
}
.score-pop {
  animation: score-pop-animation 0.15s ease-in-out;
}

/* Question fade transitions */
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-out {
  animation: fade-out 0.1s forwards;
}
.fade-in {
  animation: fade-in 0.1s forwards;
}

.page-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #121212;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
}





.quiz-card {
  position: relative;
  width: 100%;
  max-width: 320px; /* 카드 최대 너비 */
  margin: 0 auto;   /* 가운데 정렬 */
  display: flex;
  flex-direction: column;
  gap: 16px; /* 요소 간 간격을 자연스럽게 띄움 */
  padding: 24px;
  background-color: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
}

.question {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
}

.answer-input {
  padding: 10px 12px;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  background-color: #2c2c2c;
  color: #ffffff;
}

.submit-button {
  padding: 10px 0;
  font-size: 1rem;
  font-weight: bold;
  background-color: #3182f6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.category-label {
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #3182f6; /* 파란색 */
  text-align: left;
}

```

### `src/components/Timer.tsx`

```tsx
[오류] 'frontend\src\components\Timer.tsx' 파일을 찾을 수 없습니다.
```

### `src/components/ModeSelector.tsx`

```tsx
import React from 'react';
import './ModeSelector.css';

interface ModeSelectorProps {
  onSelectMode: (mode: 'time-attack' | 'survival') => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="mode-selector-container">
      <h1 className="mode-title">CHOOSE YOUR CHALLENGE</h1>
      <div className="modes">
        <div
          className="mode-card time-attack"
          onClick={() => onSelectMode('time-attack')}
        >
          <h2>Time Attack</h2>
          <p>Solve as many problems as you can in 60 seconds.</p>
        </div>
        <div
          className="mode-card survival"
          onClick={() => onSelectMode('survival')}
        >
          <h2>Survival</h2>
          <p>One wrong answer and the game is over.</p>
        </div>
      </div>
    </div>
  );
}

```

### `src/components/LevelUnlock.tsx`

```tsx
import React from 'react';
import './LevelUnlock.css';

interface LevelUnlockProps {
  clearedLevel: number;
  onNextLevel: () => void;
}

export function LevelUnlock({ clearedLevel, onNextLevel }: LevelUnlockProps) {
  return (
    <div className="level-unlock-overlay">
      <div className="level-unlock-modal">
        <h2>Level {clearedLevel} Cleared!</h2>
        <p>You've unlocked Level {clearedLevel + 1}.</p>
        <div className="level-path">
          <div className="level-node completed">{clearedLevel}</div>
          <div className="level-connector"></div>
          <div className="level-node unlocked">{clearedLevel + 1}</div>
        </div>
        <button onClick={onNextLevel} className="next-level-button">
          Continue
        </button>
      </div>
    </div>
  );
}

```

### `src/main.tsx`

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@toss/tds-mobile';

import AppContainer from './AppContainer';
import './index.css';

// Button이 theme.colors.backgroundColor를 정상 참조할 수 있도록 customTheme 객체를 생성합니다.
const customTheme = {
  colors: {
    backgroundColor: '#FFFFFF', // 흰색 배경
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={customTheme}>
      <AppContainer />
    </ThemeProvider>
  </React.StrictMode>
);
```


---
## 추가 파일

### `src/App.tsx`

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { MathQuizPage } from './pages/MathQuizPage';
import { ResultPage } from './pages/ResultPage';

function App() {
  return (
    <Routes>
      {/* (지시서 4-4항) MathQuizPage 경로 설정 */}
      <Route path="/math-quiz" element={<MathQuizPage />} />
      <Route path="/result" element={<ResultPage />} />

      {/* (임시) 현재는 math-quiz 페이지만 존재하므로, 
          기본 경로('/')로 접근 시에도 math-quiz로 이동시킵니다. */}
      <Route path="/" element={<MathQuizPage />} /> 
    </Routes>
  );
}

export default App;
```

### `src/pages/ResultPage.tsx`

```tsx
// src/pages/ResultPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import './ResultPage.css';

export function ResultPage() {
  const { score, level } = useQuizStore();
  const navigate = useNavigate();

  const handlePlayAgain = () => {
    navigate('/'); // Navigate back to the main quiz page
  };

  // Placeholder for level up logic
  const didLevelUp = score > (level * 100) * 1.5; // Example logic

  return (
    <div className="page-container">
      <div className="result-card">
        <h1 className="result-title">Quiz Complete!</h1>
        
        <div className="score-section">
          <p className="score-label">Your Score</p>
          <p className="score-value">{score}</p>
        </div>

        {didLevelUp && (
          <div className="level-up-section">
            <p className="level-up-text">🎉 Level Up! 🎉</p>
            <p className="level-value">You've reached Level {level + 1}!</p>
          </div>
        )}

        <button onClick={handlePlayAgain} className="submit-button">
          Try Again
        </button>
      </div>
    </div>
  );
}

```

### `src/styles/global.css`

```css
[오류] 'frontend\src\styles\global.css' 파일을 찾을 수 없습니다.
```

### `src/context/GameContext.tsx`

```tsx
[오류] 'frontend\src\context\GameContext.tsx' 파일을 찾을 수 없습니다.
```

### `vite.config.ts`

```ts
[오류] 'frontend\vite.config.ts' 파일을 찾을 수 없습니다.
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx", /* <-- 이 'react-jsx' 설정이 ts(2866) 오류를 해결합니다. */

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "allowJs": true
  },
  "include": [
    "vite.config.ts",
    "granite.config.ts",
    "src/**/*.ts"
  ],
  "exclude": [
    "eslint.config.js"
  ]
}

```

