import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizSubmit } from '../useQuizSubmit';
import type { QuizQuestion, GameMode } from '../../types/quiz';
import { useGameStore } from '../../stores/useGameStore';

// Mock dependencies
vi.mock('../../stores/useGameStore', () => ({
  useGameStore: vi.fn(),
}));

vi.mock('../../utils/haptic', () => ({
  vibrateMedium: vi.fn(),
  vibrateLong: vi.fn(),
}));

vi.mock('../../utils/japanese', () => ({
  normalizeRomaji: vi.fn((str: string) => str.toLowerCase().trim()),
}));

describe('useQuizSubmit', () => {
  const mockQuestion: QuizQuestion = {
    question: '5 + 3 = ?',
    answer: 8,
  };

  const defaultParams = {
    answerInput: '8',
    isSubmitting: false,
    currentQuestion: mockQuestion,
    categoryParam: 'math',
    subParam: 'addition',
    gameMode: 'time-attack' as GameMode,
    questionStartTime: Date.now(),
    hapticEnabled: false,
    useSystemKeyboard: false,
    setIsSubmitting: vi.fn(),
    setCardAnimation: vi.fn(),
    setInputAnimation: vi.fn(),
    setDisplayValue: vi.fn(),
    setIsError: vi.fn(),
    setShowFlash: vi.fn(),
    setShowSlideToast: vi.fn(),
    setDamagePosition: vi.fn(),
    setAnswerInput: vi.fn(),
    increaseScore: vi.fn(),
    decreaseScore: vi.fn(),
    generateNewQuestion: vi.fn(),
    handleGameOver: vi.fn(),
    setTotalQuestions: vi.fn(),
    setWrongAnswers: vi.fn(),
    setSolveTimes: vi.fn(),
    inputRef: { current: null },
    showFeedback: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return handleSubmit function', () => {
    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    expect(result.current.handleSubmit).toBeDefined();
    expect(typeof result.current.handleSubmit).toBe('function');
  });

  it('should not submit when isSubmitting is true', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        isSubmitting: true,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).not.toHaveBeenCalled();
    expect(defaultParams.generateNewQuestion).not.toHaveBeenCalled();
  });

  it('should not submit when currentQuestion is null', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestion: null,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).not.toHaveBeenCalled();
  });

  it('should not submit when answerInput is empty', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).not.toHaveBeenCalled();
  });

  it('should handle correct answer for math question', async () => {
    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(true);
    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('correct-flash');
    expect(defaultParams.increaseScore).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(defaultParams.generateNewQuestion).toHaveBeenCalled();
  });

  it('should handle wrong answer for math question', async () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsError).toHaveBeenCalledWith(true);
    expect(defaultParams.setDisplayValue).toHaveBeenCalledWith('8');
    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.decreaseScore).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(defaultParams.generateNewQuestion).toHaveBeenCalled();
  });

  it('should handle Japanese quiz answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        categoryParam: 'language',
        subParam: 'japanese',
        currentQuestion: {
          question: 'あ',
          answer: 'a',
        },
        answerInput: 'a',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(true);
    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should handle survival mode wrong answer', async () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        answerInput: '7',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setWrongAnswers).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(defaultParams.handleGameOver).toHaveBeenCalled();
  });

  it('should record solve time for survival mode correct answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: Date.now() - 2000, // 2 seconds ago
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setSolveTimes).toHaveBeenCalled();
  });

  it('should handle safety rope usage on wrong answer', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: ['safety_rope'],
      consumeActiveItem: vi.fn(),
    } as any);

    const onSafetyRopeUsed = vi.fn();
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
        onSafetyRopeUsed,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(onSafetyRopeUsed).toHaveBeenCalled();
    expect(defaultParams.decreaseScore).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(defaultParams.generateNewQuestion).not.toHaveBeenCalled();
  });
});

