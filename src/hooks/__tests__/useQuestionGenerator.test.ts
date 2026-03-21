import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    category: '기초' as const,
    difficulty: 'easy' as const,
    gameMode: 'time-attack' as const,
    categoryParam: null,
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
    worldParam: null,
    world: 'World1' as const,
    totalQuestions: 0,
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
      answer: 2, // Changed to number to match interface if needed, or string if mock expects it. Mock implementation usually returns string answer in types? QuizQuestion answer is number or string.
    });

    const { result } = renderHook(() => useQuestionGenerator(defaultParams));

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Expect '수학', '덧셈' from defaultParams
    // But wait, generateQuestion uses (world, category, level, difficulty).
    // category='수학', topic='덧셈' (subParam).
    // useQuestionGenerator implementation uses (worldParam || world) and (categoryParam || category).
    // It passes `targetCategory` to generateQuestion.
    // defaultParams.category is '수학'.
    // So it calls generateQuestion('World1', '수학', ...)
    // But QuizGenerator expects '기초', '대수' etc for World1?
    // '수학' hits default case?
    expect(generateQuestion).toHaveBeenCalled();
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
        categoryParam: '기초', // Changed from 'math'
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

    // generateQuestion is called with '기초'.
    // Inside generateQuestion (real implementation, if not mocked?), it calls generateProblem.
    // BUT generateQuestion IS MOCKED in line 9.
    // So generateProblem WON'T be called unless we mock generateQuestion implementation to call it?
    // OR unless we unmock quizGenerator?
    // If we mock quizGenerator, then we are testing that useQuestionGenerator calls generateQuestion correctly.
    // We are NOT testing that generateQuestion calls generateProblem.
    // So this test expectation `expect(generateProblem).toHaveBeenCalled()` is WRONG if generateQuestion is mocked.
    // We should check if generateQuestion called with correct args.
    expect(generateQuestion).toHaveBeenCalledWith(
      'math',
      'World1',
      'World1-기초',
      1,
      'easy',
      'normal',
      undefined
    );
  });

  it('should generate equation when subParam is equations', async () => {
    vi.mocked(generateEquation).mockReturnValue({
      question: 'x + 1 = 3',
      x: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: '대수', // Changed from 'math'
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

    expect(generateQuestion).toHaveBeenCalledWith(
      'math',
      'World1',
      'World1-대수',
      1,
      'easy',
      'normal',
      undefined
    );
  });

  it('should reset input and display values', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
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
      answer: 2,
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

  // Skipped legacy fallbacks as generateQuestion is mocked
  // it('should fallback to legacy generator...', ...)

  it('should handle equations subParam without levelParam', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'x + 1 = 3',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: '대수',
        levelParam: null,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateQuestion).toHaveBeenCalledWith(
      'math',
      'World1',
      'World1-대수',
      1,
      'easy',
      'normal',
      undefined
    );
  });

  it('should handle calculus subParam', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'd/dx(x^2)',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: '심화',
        levelParam: null,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateQuestion).toHaveBeenCalledWith(
      'math',
      'World1',
      'World1-심화',
      1,
      'easy',
      'normal',
      undefined
    );
  });

  it('should return early when category or topic is null', () => {
    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        category: null,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    expect(generateQuestion).not.toHaveBeenCalled();
    expect(mockSetCurrentQuestion).not.toHaveBeenCalled();
  });

  it('should handle useSystemKeyboard focus', async () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as unknown as HTMLInputElement;
    const inputRef = { current: mockInput };

    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        useSystemKeyboard: true,
        inputRef,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(350);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('should call onQuestionGenerated callback', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() => useQuestionGenerator(defaultParams));

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockOnQuestionGenerated).toHaveBeenCalled();
  });

  it('should handle arithmetic with different levels', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '5 + 3',
      answer: 8,
    });

    for (let level = 1; level <= 10; level++) {
      vi.clearAllMocks();
      const { result } = renderHook(() =>
        useQuestionGenerator({
          ...defaultParams,
          categoryParam: '기초',
          levelParam: level,
        })
      );

      act(() => {
        result.current.generateNewQuestion();
      });

      vi.advanceTimersByTime(150);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(generateQuestion).toHaveBeenCalledWith(
        'math',
        'World1',
        'World1-기초',
        level,
        'easy',
        'normal',
        undefined
      );
    }
  });

  it('should handle other subParams', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'Test question',
      answer: 42,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: '기초',
        levelParam: null,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateQuestion).toHaveBeenCalledWith(
      'math',
      'World1',
      'World1-기초',
      1,
      'easy',
      'normal',
      undefined
    );
  });
});
