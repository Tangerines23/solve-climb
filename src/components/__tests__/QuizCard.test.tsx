import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizCard } from '../QuizCard';
import type { QuizQuestion, Category, GameMode } from '../../types/quiz';
// Mock dependencies
vi.mock('../../utils/debugLogger', () => ({
  sendDebugLog: vi.fn(),
}));

vi.mock('../TimerCircle', () => ({
  TimerCircle: ({ duration }: { duration: number; onComplete: () => void }) => (
    <div data-testid="timer-circle">Timer: {duration}s</div>
  ),
}));

vi.mock('../CustomKeypad', () => ({
  CustomKeypad: ({
    onNumberClick,
    onBackspace,
    onSubmit,
    disabled,
  }: {
    onNumberClick: (num: string) => void;
    onBackspace?: () => void;
    onSubmit: (e: React.FormEvent) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="custom-keypad" className={disabled ? 'disabled' : ''}>
      <button onClick={() => onNumberClick('1')} disabled={disabled}>
        1
      </button>
      <button onClick={() => onBackspace?.()} disabled={disabled}>
        Backspace
      </button>
      <button onClick={onSubmit} disabled={disabled}>
        Submit
      </button>
    </div>
  ),
}));

vi.mock('../QwertyKeypad', () => ({
  QwertyKeypad: ({
    onKeyPress,
    disabled,
  }: {
    onKeyPress: (key: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="qwerty-keypad" className={disabled ? 'disabled' : ''}>
      <button onClick={() => onKeyPress('1')} disabled={disabled}>
        1
      </button>
    </div>
  ),
}));

describe('QuizCard', () => {
  const mockQuestion: QuizQuestion = {
    question: '5 + 3 = ?',
    answer: 8,
  };

  const defaultProps = {
    quizState: {
      currentQuestion: mockQuestion,
      answerInput: '',
      displayValue: '',
      category: '수학' as Category,
      topic: '덧셈',
      categoryParam: 'math',
      subParam: 'addition',
      levelParam: null,
      gameMode: 'time-attack' as GameMode,
      timeLimit: 60,
      questionKey: 1,
      timerResetKey: 0,
      totalQuestions: 0,
      lives: 3,
      useSystemKeyboard: false,
      activeLandmark: null,
      remainingPauses: 3,
      altitudePhase: 'ground',
    },
    quizAnimations: {
      isSubmitting: false,
      isError: false,
      isPaused: false,
      isInputPaused: false,
      showExitConfirm: false,
      isFadingOut: false,
      cardAnimation: '',
      inputAnimation: '',
      questionAnimation: '',
      showFlash: false,
      showSlideToast: false,
      toastValue: '',
      damagePosition: { left: '0px', top: '0px' },
    },
    quizHandlers: {
      onSafetyRopeUsed: vi.fn(),
      onLastSpurt: vi.fn(),
      onPause: vi.fn(),
      generateNewQuestion: vi.fn(),
      handleSubmit: vi.fn(),
      handleGameOver: vi.fn(),
      handleKeypadNumber: vi.fn(),
      handleQwertyKeyPress: vi.fn(),
      handleKeypadClear: vi.fn(),
      handleKeypadBackspace: vi.fn(),
    },
    inputRef: { current: null } as unknown as React.RefObject<HTMLInputElement>,
    exitConfirmTimeoutRef: {
      current: null,
    } as unknown as React.MutableRefObject<NodeJS.Timeout | null>,
    setAnswerInput: vi.fn(),
    setDisplayValue: vi.fn(),
    setShowExitConfirm: vi.fn(),
    setIsFadingOut: vi.fn(),
    SURVIVAL_QUESTION_TIME: 30,
    activeItems: [],
    usedItems: [],
    score: 0,
    isExhausted: false,
    handleTimeUp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render question text', () => {
    render(<QuizCard {...defaultProps} />);
    expect(screen.getByText('5 + 3 = ?')).toBeInTheDocument();
  });

  it('should render answer input field when using system keyboard', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{
          ...defaultProps.quizState,
          useSystemKeyboard: true,
          answerInput: '8',
          displayValue: '8',
        }}
      />
    );
    const input = screen.getByDisplayValue('8');
    expect(input).toBeInTheDocument();
  });

  it('should render TimerCircle component', () => {
    render(<QuizCard {...defaultProps} />);
    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
  });

  it('should render CustomKeypad when useSystemKeyboard is false', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{ ...defaultProps.quizState, useSystemKeyboard: false }}
      />
    );
    expect(screen.getByTestId('custom-keypad')).toBeInTheDocument();
  });

  it('should call handleKeypadNumber when number is clicked', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{ ...defaultProps.quizState, useSystemKeyboard: false }}
      />
    );
    fireEvent.click(screen.getByText('1'));
    expect(defaultProps.quizHandlers.handleKeypadNumber).toHaveBeenCalledWith('1');
  });

  it('should handle null currentQuestion', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{
          ...defaultProps.quizState,
          currentQuestion: null,
          categoryParam: 'math',
          subParam: 'addition',
        }}
      />
    );
    expect(screen.getByText('문제를 생성하는 중...')).toBeInTheDocument();
  });

  it('should display answer when showAnswer is true', () => {
    render(
      <QuizCard {...defaultProps} quizState={{ ...defaultProps.quizState, showAnswer: true }} />
    );
    expect(screen.getByText(/정답:/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should display slide toast when showSlideToast is true', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizAnimations={{ ...defaultProps.quizAnimations, showSlideToast: true, toastValue: '-3m' }}
      />
    );
    expect(screen.getByText('-3m')).toBeInTheDocument();
  });

  it('should apply card animation class', () => {
    const { container } = render(
      <QuizCard
        {...defaultProps}
        quizAnimations={{ ...defaultProps.quizAnimations, cardAnimation: 'slide-in' }}
      />
    );
    const quizCard = container.querySelector('.quiz-card');
    expect(quizCard).toHaveClass('slide-in');
  });

  it('should disable input when isPaused is true (system keyboard)', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{ ...defaultProps.quizState, useSystemKeyboard: true }}
        quizAnimations={{ ...defaultProps.quizAnimations, isPaused: true, isInputPaused: true }}
      />
    );
    const input = screen.getByDisplayValue('');
    expect(input).toBeDisabled();
  });

  it('should disable keypad when isPaused is true (custom keypad)', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{ ...defaultProps.quizState, useSystemKeyboard: false }}
        quizAnimations={{ ...defaultProps.quizAnimations, isPaused: true, isInputPaused: true }}
      />
    );
    const keypad = screen.getByTestId('custom-keypad');
    expect(keypad).toHaveClass('disabled');
    const button = screen.getByText('1');
    expect(button).toBeDisabled();
  });

  it('should disable submit button when isPaused is true', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{ ...defaultProps.quizState, useSystemKeyboard: true, answerInput: '8' }}
        quizAnimations={{ ...defaultProps.quizAnimations, isPaused: true, isInputPaused: true }}
      />
    );
    const submitButton = screen.getByText('제출');
    expect(submitButton).toBeDisabled();
  });

  it('should display category and topic label', () => {
    render(
      <QuizCard
        {...defaultProps}
        quizState={{ ...defaultProps.quizState, category: '수학', topic: '덧셈' }}
      />
    );
    expect(screen.getByText(/수학/)).toBeInTheDocument();
    expect(screen.getByText(/덧셈/)).toBeInTheDocument();
  });
});
