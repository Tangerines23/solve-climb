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

  it('should fallback to legacy generator when generateProblem fails', async () => {
    vi.mocked(generateProblem).mockImplementation(() => {
      throw new Error('Generation failed');
    });
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
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

    expect(generateQuestion).toHaveBeenCalled();
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });

  it('should fallback to legacy generator when generateEquation fails', async () => {
    vi.mocked(generateEquation).mockImplementation(() => {
      throw new Error('Generation failed');
    });
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'x + 1 = 3',
      answer: 2,
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

    expect(generateQuestion).toHaveBeenCalled();
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });

  it('should handle equations subParam without levelParam', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'x + 1 = 3',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
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

    expect(generateQuestion).toHaveBeenCalledWith('수학', 'equations', 'easy');
  });

  it('should handle calculus subParam', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'd/dx(x^2)',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'calculus',
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

    expect(generateQuestion).toHaveBeenCalledWith('수학', 'calculus', 'easy');
  });

  it('should return early when category or topic is null', () => {
    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        category: null,
        topic: null,
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
    const mockInput = { focus: mockFocus } as any;
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

    vi.advanceTimersByTime(350); // 150ms + 200ms

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
    const callArgs = mockOnQuestionGenerated.mock.calls[0];
    expect(callArgs[0]).toEqual({ question: '1 + 1', answer: 2 });
    expect(callArgs[1]).toBeDefined(); // questionId (UUID)
  });

  it('should handle arithmetic with different levels', async () => {
    vi.mocked(generateProblem).mockReturnValue({
      expression: '5 + 3',
      answer: 8,
    });

    for (let level = 1; level <= 10; level++) {
      vi.clearAllMocks();
      const { result } = renderHook(() =>
        useQuestionGenerator({
          ...defaultParams,
          categoryParam: 'math',
          subParam: 'arithmetic',
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

      expect(generateProblem).toHaveBeenCalledWith(level);
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
        categoryParam: 'math',
        subParam: 'other-topic',
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

    expect(generateQuestion).toHaveBeenCalledWith('수학', 'other-topic', 'easy');
  });

  it('should not call onQuestionGenerated when callback is not provided', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        onQuestionGenerated: undefined,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockOnQuestionGenerated).not.toHaveBeenCalled();
  });

  it('should not focus input when useSystemKeyboard is false', async () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        useSystemKeyboard: false,
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

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus input when inputRef.current is null', async () => {
    const inputRef = { current: null };

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

    // Should not throw error
    expect(generateQuestion).toHaveBeenCalled();
  });

  it('should handle when onQuestionGenerated is not provided in arithmetic path', async () => {
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
        onQuestionGenerated: undefined,
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
    expect(mockOnQuestionGenerated).not.toHaveBeenCalled();
  });

  it('should handle when onQuestionGenerated is not provided in equations path', async () => {
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
        onQuestionGenerated: undefined,
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
    expect(mockOnQuestionGenerated).not.toHaveBeenCalled();
  });

  it('should return early when categoryName is not found in CATEGORY_MAP', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: '2',
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: 'invalid-category',
        subParam: 'arithmetic',
        levelParam: 1,
        category: null,
        topic: null,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should not call generateProblem or generateQuestion because categoryName is null
    // and category/topic are also null, so early return happens
    expect(generateProblem).not.toHaveBeenCalled();
    expect(generateQuestion).not.toHaveBeenCalled();
  });

  it('should handle arithmetic in survival mode with focus', async () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

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
        gameMode: 'survival',
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

    expect(generateProblem).toHaveBeenCalledWith(1);
    expect(mockSetQuestionKey).toHaveBeenCalled();
    expect(mockSetQuestionStartTime).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should handle equations in survival mode with focus', async () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

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
        gameMode: 'survival',
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

    expect(generateEquation).toHaveBeenCalledWith(1);
    expect(mockSetQuestionKey).toHaveBeenCalled();
    expect(mockSetQuestionStartTime).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should handle arithmetic in time-attack mode', async () => {
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
        gameMode: 'time-attack',
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
    expect(mockSetQuestionKey).not.toHaveBeenCalled();
    expect(mockSetQuestionStartTime).not.toHaveBeenCalled();
  });

  it('should handle equations in time-attack mode', async () => {
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
        gameMode: 'time-attack',
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
    expect(mockSetQuestionKey).not.toHaveBeenCalled();
    expect(mockSetQuestionStartTime).not.toHaveBeenCalled();
  });

  it('should handle arithmetic without useSystemKeyboard', async () => {
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
        useSystemKeyboard: false,
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

  it('should handle equations without useSystemKeyboard', async () => {
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
        useSystemKeyboard: false,
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

  it('should handle when categoryParam is null but category is provided', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: '2',
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: null,
        subParam: null,
        category: '수학',
        topic: '덧셈',
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateQuestion).toHaveBeenCalledWith('수학', '덧셈', 'easy');
  });

  it('should handle when subParam is provided but categoryParam is null', async () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: '2',
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: null,
        subParam: 'arithmetic',
        category: '수학',
        topic: '덧셈',
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    vi.advanceTimersByTime(150);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(generateQuestion).toHaveBeenCalledWith('수학', '덧셈', 'easy');
  });

  it('should handle arithmetic with inputRef.current as null', async () => {
    const inputRef = { current: null };

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

    expect(generateProblem).toHaveBeenCalledWith(1);
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });

  it('should handle equations with inputRef.current as null', async () => {
    const inputRef = { current: null };

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

    expect(generateEquation).toHaveBeenCalledWith(1);
    expect(mockSetCurrentQuestion).toHaveBeenCalled();
  });
});

