import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuizAnswerArea } from '../QuizAnswerArea';
import React from 'react';
import { useQuiz } from '@/features/quiz/contexts/QuizContext';

// Mock useQuiz
vi.mock('@/features/quiz/contexts/QuizContext', () => ({
  useQuiz: vi.fn(),
}));

describe('QuizAnswerArea', () => {
  const mockSetAnswerInput = vi.fn();
  const mockSetDisplayValue = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e?.preventDefault());
  const inputRef = { current: null } as any;

  const defaultMockValues: any = {
    quizState: {
      currentQuestion: {
        id: 'q1',
        question: '테스트 질문',
        answer: '10',
        inputType: 'number',
      },
      answerInput: '',
      displayValue: '',
      category: null,
      topic: 'test',
      categoryParam: 'math',
      subParam: 'basic',
      levelParam: 1,
      gameMode: 'practice',
      timeLimit: 10,
      questionKey: 0,
      timerResetKey: 0,
      totalQuestions: 10,
      lives: 3,
      useSystemKeyboard: true,
      activeLandmark: null,
      remainingPauses: 3,
      altitudePhase: 'start',
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
      damagePosition: { left: '0', top: '0' },
    },
    quizHandlers: {
      handleSubmit: mockHandleSubmit,
    },
    inputRef,
    setAnswerInput: mockSetAnswerInput,
    setDisplayValue: mockSetDisplayValue,
    effectiveInputPaused: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuiz).mockReturnValue(defaultMockValues);
  });

  it('should render nothing if currentQuestion is missing', () => {
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: { ...defaultMockValues.quizState, currentQuestion: null },
    });
    const { container } = render(<QuizAnswerArea />);
    expect(container.firstChild).toBeNull();
  });

  it('should render input for numeric quiz', () => {
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputMode', 'numeric');
  });

  it('should handle numeric input change', () => {
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');

    fireEvent.change(input, { target: { value: '123' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('123');
    expect(mockSetDisplayValue).toHaveBeenCalledWith('123');
  });

  it('should filter non-numeric input for basic numeric quiz', () => {
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');

    fireEvent.change(input, { target: { value: 'abc123' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('123');
  });

  it('should allow negative numbers in equation quiz', () => {
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: {
        ...defaultMockValues.quizState,
        categoryParam: 'math',
        subParam: 'equations',
      },
    });
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');

    fireEvent.change(input, { target: { value: '-5' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('-5');
  });

  it('should handle Japanese quiz input (Romaji)', () => {
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: {
        ...defaultMockValues.quizState,
        categoryParam: 'language',
        subParam: 'japanese',
      },
    });
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('로마지 입력 (예: a, ki)');

    fireEvent.change(input, { target: { value: 'ka123' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('ka');
  });

  it('should handle coordinate input mode', () => {
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: {
        ...defaultMockValues.quizState,
        currentQuestion: {
          ...defaultMockValues.quizState.currentQuestion,
          inputType: 'coordinate',
        },
      },
    });

    // Mock CoordinateGrid to avoid deep testing
    vi.mock('../CoordinateGrid', () => ({
      CoordinateGrid: ({ onShoot }: any) => (
        <button onClick={() => onShoot(3, 4)}>Shoot 3,4</button>
      ),
    }));

    render(<QuizAnswerArea />);
    const shootBtn = screen.getByText('Shoot 3,4');
    fireEvent.click(shootBtn);

    expect(mockSetAnswerInput).toHaveBeenCalledWith('3,4');
    expect(mockSetDisplayValue).toHaveBeenCalledWith('3,4');

    // Check if handleSubmit is called after timeout
    vi.useFakeTimers();
    fireEvent.click(shootBtn);
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(mockHandleSubmit).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle Enter key press', () => {
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('should render custom keyboard display when system keyboard is disabled', () => {
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: {
        ...defaultMockValues.quizState,
        useSystemKeyboard: false,
        answerInput: '42',
      },
    });
    render(<QuizAnswerArea />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('정답 입력')).not.toBeInTheDocument();
  });

  it('should handle input filtering for allowNegative with multiple signs', () => {
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: {
        ...defaultMockValues.quizState,
        categoryParam: 'math',
        subParam: 'equations',
      },
    });
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');

    // Multiple minus signs should result in only one at the start
    fireEvent.change(input, { target: { value: '--5' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('-5');

    // Minus sign in the middle should be moved to front
    fireEvent.change(input, { target: { value: '5-' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('-5');
  });

  it('should enforce max length for different input types', () => {
    // Numeric basic: max 6
    render(<QuizAnswerArea />);
    const input = screen.getByPlaceholderText('정답 입력');
    fireEvent.change(input, { target: { value: '1234567' } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('123456');

    // Japanese: max 20
    vi.mocked(useQuiz).mockReturnValue({
      ...defaultMockValues,
      quizState: {
        ...defaultMockValues.quizState,
        categoryParam: 'language',
        subParam: 'japanese',
      },
    });
    render(<QuizAnswerArea />);
    const jaInput = screen.getByPlaceholderText('로마지 입력 (예: a, ki)');
    fireEvent.change(jaInput, { target: { value: 'a'.repeat(21) } });
    expect(mockSetAnswerInput).toHaveBeenCalledWith('a'.repeat(20));
  });
});
