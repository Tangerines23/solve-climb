import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionGenerator } from '../useQuestionGenerator';
import { generateQuestion } from '../../utils/quizGenerator';
import { generateProblem } from '../../utils/MathProblemGenerator';
import { generateEquation } from '../../utils/EquationProblemGenerator';

// Mock dependencies
vi.mock('../../utils/quizGenerator', () => ({
  generateQuestion: vi.fn(),
}));

vi.mock('../../utils/MathProblemGenerator', () => ({
  generateProblem: vi.fn(),
}));

vi.mock('../../utils/EquationProblemGenerator', () => ({
  generateEquation: vi.fn(),
}));

describe('useQuestionGenerator', () => {
  const mockSetCurrentQuestion = vi.fn();
  const mockSetAnswerInput = vi.fn();
  const mockSetDisplayValue = vi.fn();
  const mockSetIsError = vi.fn();
  const mockSetShowFlash = vi.fn();
  const mockSetQuestionAnimation = vi.fn();
  const mockSetQuestionKey = vi.fn();
  const mockSetQuestionStartTime = vi.fn();
  const mockOnQuestionGenerated = vi.fn();
  const mockInputRef = { current: null };

  const defaultParams = {
    category: '수학' as const,
    topic: '덧셈' as const,
    difficulty: 'easy' as const,
    gameMode: 'time-attack' as const,
    categoryParam: null,
    subParam: null,
    levelParam: null,
    useSystemKeyboard: false,
    inputRef: mockInputRef,
    setCurrentQuestion: mockSetCurrentQuestion,
    setAnswerInput: mockSetAnswerInput,
    setDisplayValue: mockSetDisplayValue,
    setIsError: mockSetIsError,
    setShowFlash: mockSetShowFlash,
    setQuestionAnimation: mockSetQuestionAnimation,
    setQuestionKey: mockSetQuestionKey,
    setQuestionStartTime: mockSetQuestionStartTime,
    onQuestionGenerated: mockOnQuestionGenerated,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should generate question using generateQuestion when no URL params', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: '2',
    });

    const { result } = renderHook(() => useQuestionGenerator(defaultParams));

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateQuestion).toHaveBeenCalledWith('수학', '덧셈', 'easy');
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });

  it('should generate arithmetic problem when subParam is arithmetic', async () => {
    vi.mocked(generateProblem).mockReturnValue({
      expression: '2 + 3',
      answer: 5,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'arithmetic',
        levelParam: 1,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateProblem).toHaveBeenCalledWith(1);
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });

  it('should generate equation when subParam is equations', async () => {
    vi.mocked(generateEquation).mockReturnValue({
      question: 'x + 1 = 3',
      x: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        levelParam: 1,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateEquation).toHaveBeenCalledWith(1);
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });

  it('should reset input and display values', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: '2',
    });

    const { result } = renderHook(() => useQuestionGenerator(defaultParams));

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSetAnswerInput).toHaveBeenCalledWith('');
    expect(mockSetDisplayValue).toHaveBeenCalledWith('');
    expect(mockSetIsError).toHaveBeenCalledWith(false);
  });

  it('should update question key in survival mode', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: '2',
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        gameMode: 'survival',
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSetQuestionKey).toHaveBeenCalled();
    expect(mockSetQuestionStartTime).toHaveBeenCalled();
  });
});

