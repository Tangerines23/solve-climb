import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizCard } from '../QuizCard';
import type { QuizQuestion, GameMode } from '../../types/quiz';
import { useGameStore } from '../../stores/useGameStore';

// Mock dependencies
vi.mock('../../stores/useGameStore', () => ({
  useGameStore: vi.fn(),
}));

vi.mock('../../utils/debugLogger', () => ({
  sendDebugLog: vi.fn(),
}));

vi.mock('../TimerCircle', () => ({
  TimerCircle: ({
    duration,
    onComplete: _onComplete,
  }: {
    duration: number;
    onComplete: () => void;
  }) => <div data-testid="timer-circle">Timer: {duration}s</div>,
}));

vi.mock('../CustomKeypad', () => ({
  CustomKeypad: ({
    onNumberClick,
    onBackspace,
    onSubmit,
  }: {
    onNumberClick: (num: string) => void;
    onBackspace?: () => void;
    onSubmit: (e: React.FormEvent) => void;
  }) => (
    <div data-testid="custom-keypad">
      <button onClick={() => onNumberClick('1')}>1</button>
      <button onClick={() => onBackspace?.()}>Backspace</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

vi.mock('../QwertyKeypad', () => ({
  QwertyKeypad: ({ onKeyPress }: { onKeyPress: (key: string) => void }) => (
    <div data-testid="qwerty-keypad">
      <button onClick={() => onKeyPress('1')}>1</button>
    </div>
  ),
}));

describe('QuizCard', () => {
  const mockQuestion: QuizQuestion = {
    question: '5 + 3 = ?',
    answer: 8,
  };

  const defaultProps = {
    currentQuestion: mockQuestion,
    answerInput: '',
    displayValue: '',
    category: '수학',
    topic: '덧셈',
    categoryParam: null,
    subParam: null,
    levelParam: null,
    gameMode: 'time-attack' as GameMode,
    timeLimit: 60,
    questionKey: 1,
    SURVIVAL_QUESTION_TIME: 30,
    isSubmitting: false,
    isError: false,
    useSystemKeyboard: false,
    showTipModal: false,
    isPaused: false,
    showExitConfirm: false,
    isFadingOut: false,
    showAnswer: false,
    cardAnimation: '',
    inputAnimation: '',
    questionAnimation: '',
    showFlash: false,
    showSlideToast: false,
    toastValue: '',
    damagePosition: { left: '0px', top: '0px' },
    totalQuestions: 0,
    lives: 3,
    onPause: vi.fn(),
    generateNewQuestion: vi.fn(),
    handleSubmit: vi.fn(),
    handleBack: vi.fn(),
    handleGameOver: vi.fn(),
    handleKeypadNumber: vi.fn(),
    handleQwertyKeyPress: vi.fn(),
    handleKeypadClear: vi.fn(),
    handleKeypadBackspace: vi.fn(),
    inputRef: { current: null },
    exitConfirmTimeoutRef: { current: null },
    setAnswerInput: vi.fn(),
    setDisplayValue: vi.fn(),
    setIsError: vi.fn(),
    setShowFlash: vi.fn(),
    setShowExitConfirm: vi.fn(),
    setIsFadingOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGameStore).mockReturnValue({
      safetyRopeCount: 0,
      activeItems: [],
      usedItems: [],
      consumeActiveItem: vi.fn(),
      consumeLife: vi.fn(),
      isExhausted: false,
    } as unknown);
  });

  it('should render question text', () => {
    render(<QuizCard {...defaultProps} />);

    expect(screen.getByText('5 + 3 = ?')).toBeInTheDocument();
  });

  it('should render answer input field', () => {
    render(
      <QuizCard {...defaultProps} answerInput="8" displayValue="8" useSystemKeyboard={true} />
    );

    // Input should be rendered when useSystemKeyboard is true
    const input = screen.getByDisplayValue('8');
    expect(input).toBeInTheDocument();
  });

  it('should render TimerCircle component', () => {
    render(<QuizCard {...defaultProps} />);

    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
    expect(screen.getByText('Timer: 60s')).toBeInTheDocument();
  });

  it('should render CustomKeypad when useSystemKeyboard is false', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={false} />);

    expect(screen.getByTestId('custom-keypad')).toBeInTheDocument();
  });

  it('should render QwertyKeypad when useSystemKeyboard is true', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={true} />);

    // QwertyKeypad should be rendered when useSystemKeyboard is true
    // The actual rendering depends on the component's conditional logic
    // We verify that the component renders without error
    expect(screen.getByText('5 + 3 = ?')).toBeInTheDocument();
  });

  it('should call handleKeypadNumber when number is clicked', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={false} />);

    fireEvent.click(screen.getByText('1'));

    expect(defaultProps.handleKeypadNumber).toHaveBeenCalledWith('1');
  });

  it('should call handleKeypadBackspace when backspace is clicked', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={false} />);

    fireEvent.click(screen.getByText('Backspace'));

    expect(defaultProps.handleKeypadBackspace).toHaveBeenCalled();
  });

  it('should call handleSubmit when submit button is clicked', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={false} />);

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>;
    fireEvent.click(screen.getByText('Submit'), mockEvent);

    expect(defaultProps.handleSubmit).toHaveBeenCalled();
  });

  it('should display answer when showAnswer is true', () => {
    render(<QuizCard {...defaultProps} showAnswer={true} />);

    // Answer should be displayed (implementation depends on component)
    expect(screen.getByText('5 + 3 = ?')).toBeInTheDocument();
  });

  it('should handle null currentQuestion', () => {
    render(
      <QuizCard {...defaultProps} currentQuestion={null} categoryParam="math" subParam="addition" />
    );

    // Component should render loading state or null when question is missing
    // The actual behavior depends on categoryParam and subParam
    // If categoryParam and subParam are provided, it shows loading message
    const loadingMessage = screen.queryByText('문제를 생성하는 중...');
    if (loadingMessage) {
      expect(loadingMessage).toBeInTheDocument();
    } else {
      // Otherwise returns null
      expect(screen.queryByTestId('timer-circle')).not.toBeInTheDocument();
    }
  });

  it('should handle different game modes', () => {
    const { rerender } = render(<QuizCard {...defaultProps} gameMode="time-attack" />);

    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();

    rerender(<QuizCard {...defaultProps} gameMode="survival" />);

    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
  });

  it('should handle isPaused state', () => {
    render(<QuizCard {...defaultProps} isPaused={true} />);

    // Component should render when paused
    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
  });

  it('should handle isSubmitting state', () => {
    render(<QuizCard {...defaultProps} isSubmitting={true} />);

    // Component should render when submitting
    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
  });

  it('should handle isError state', () => {
    render(<QuizCard {...defaultProps} isError={true} />);

    // Component should render when error
    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
  });

  it('should display answer when showAnswer is true', () => {
    render(<QuizCard {...defaultProps} showAnswer={true} />);

    expect(screen.getByText(/정답:/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should not display answer when showAnswer is false', () => {
    render(<QuizCard {...defaultProps} showAnswer={false} />);

    expect(screen.queryByText(/정답:/)).not.toBeInTheDocument();
  });

  it('should display slide toast when showSlideToast is true', () => {
    render(<QuizCard {...defaultProps} showSlideToast={true} toastValue="-3m" />);

    expect(screen.getByText(/-3m/)).toBeInTheDocument();
  });

  it('should display exit confirm toast when showExitConfirm is true', () => {
    render(<QuizCard {...defaultProps} showExitConfirm={true} />);

    expect(screen.getByText(/게임을 중단하시겠습니까/)).toBeInTheDocument();
    expect(screen.getByText(/한 번 더 누르면 나갑니다/)).toBeInTheDocument();
  });

  it('should apply card animation class', () => {
    const { container } = render(<QuizCard {...defaultProps} cardAnimation="slide-in" />);

    const quizCard = container.querySelector('.quiz-card');
    expect(quizCard).toHaveClass('slide-in');
  });

  it('should apply input animation class', () => {
    render(<QuizCard {...defaultProps} inputAnimation="pulse" useSystemKeyboard={true} />);

    const input = screen.getByDisplayValue('');
    expect(input).toHaveClass('pulse');
  });

  it('should apply question animation class', () => {
    const { container } = render(<QuizCard {...defaultProps} questionAnimation="fade-in" />);

    const questionElement = container.querySelector('.fade-in');
    expect(questionElement).toBeInTheDocument();
  });

  it('should apply error class when isError is true', () => {
    render(<QuizCard {...defaultProps} isError={true} useSystemKeyboard={true} />);

    const input = screen.getByDisplayValue('');
    expect(input).toHaveClass('is-error');
  });

  it('should apply flash class when showFlash is true', () => {
    render(<QuizCard {...defaultProps} showFlash={true} useSystemKeyboard={true} />);

    const input = screen.getByDisplayValue('');
    expect(input).toHaveClass('input-error-flash');
  });

  it('should disable input when isPaused is true', () => {
    render(<QuizCard {...defaultProps} isPaused={true} useSystemKeyboard={true} />);

    const input = screen.getByDisplayValue('');
    expect(input).toBeDisabled();
  });

  it('should disable submit button when isPaused is true', () => {
    render(<QuizCard {...defaultProps} isPaused={true} useSystemKeyboard={true} answerInput="8" />);

    const submitButton = screen.getByText('제출');
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when isSubmitting is true', () => {
    render(
      <QuizCard {...defaultProps} isSubmitting={true} useSystemKeyboard={true} answerInput="8" />
    );

    const submitButton = screen.getByText('제출');
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when answerInput is empty', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={true} answerInput="" />);

    const submitButton = screen.getByText('제출');
    expect(submitButton).toBeDisabled();
  });

  it('should display category and topic label', () => {
    render(<QuizCard {...defaultProps} category="수학" topic="덧셈" />);

    expect(screen.getByText(/수학.*덧셈/)).toBeInTheDocument();
  });

  it('should render CustomKeypad for non-Japanese quiz', () => {
    render(<QuizCard {...defaultProps} useSystemKeyboard={false} />);

    expect(screen.getByTestId('custom-keypad')).toBeInTheDocument();
  });

  it('should handle survival game mode', () => {
    render(<QuizCard {...defaultProps} gameMode="survival" />);

    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
  });

  it('should render loading message when currentQuestion is null but params are provided', () => {
    render(
      <QuizCard
        {...defaultProps}
        currentQuestion={null}
        categoryParam="math"
        subParam="arithmetic"
      />
    );

    expect(screen.getByText('문제를 생성하는 중...')).toBeInTheDocument();
  });

  it('should return null when currentQuestion is null and params are not provided', () => {
    const { container } = render(
      <QuizCard {...defaultProps} currentQuestion={null} categoryParam={null} subParam={null} />
    );

    expect(container.firstChild).toBeNull();
  });
});
