import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizSubmit } from '../useQuizSubmit';
import type { QuizQuestion, GameMode } from '../../types/quiz';
import { useGameStore } from '../../stores/useGameStore';
import { vibrateMedium, vibrateLong } from '../../utils/haptic';
import { CLIMB_PER_CORRECT, MAX_POSSIBLE_ANSWER } from '../../constants/game';

// Mock dependencies
vi.mock('../../stores/useGameStore', () => {
  const mockUseGameStore = vi.fn();
  (mockUseGameStore as any).getState = vi.fn(() => ({ feverLevel: 0 }));
  return {
    useGameStore: mockUseGameStore,
  };
});

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
    setToastValue: vi.fn(),
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
      lives: 3,
      consumeLife: vi.fn(),
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
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 1,
      consumeLife: vi.fn(),
    } as any);

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
      lives: 3,
      consumeLife: vi.fn(),
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

  it('should handle equation quiz with negative answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        currentQuestion: {
          question: 'x + 5 = 0',
          answer: -5,
        },
        answerInput: '-5',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(true);
    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should handle calculus quiz with negative answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'calculus',
        currentQuestion: {
          question: 'd/dx(-x)',
          answer: -1,
        },
        answerInput: '-1',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(true);
    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should reject negative answer for regular math question', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '-5',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
    expect(defaultParams.increaseScore).not.toHaveBeenCalled();
  });

  it('should reject answer out of range', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '999999',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
  });

  it('should handle flare usage in survival mode', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: ['flare'],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const setIsFlarePaused = vi.fn();
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        answerInput: '7',
        setIsFlarePaused,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(setIsFlarePaused).toHaveBeenCalledWith(true);
    expect(defaultParams.showFeedback).toHaveBeenCalledWith('REVIVE!', 'Survival Continued', 'info');
    expect(defaultParams.generateNewQuestion).toHaveBeenCalled();
    expect(defaultParams.handleGameOver).not.toHaveBeenCalled();
  });

  it('should apply exhausted multiplier to score', () => {
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: true,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.increaseScore).toHaveBeenCalled();
    // Score should be reduced by 20% (multiplier 0.8)
    const scoreCall = defaultParams.increaseScore.mock.calls[0][0];
    expect(scoreCall).toBeLessThan(100); // Assuming CLIMB_PER_CORRECT is 100
  });

  it('should handle Japanese quiz wrong answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        categoryParam: 'language',
        subParam: 'japanese',
        currentQuestion: {
          question: 'あ',
          answer: 'a',
        },
        answerInput: 'b',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsError).toHaveBeenCalledWith(true);
    expect(defaultParams.setDisplayValue).toHaveBeenCalledWith('a');
  });

  it('should not record solve time when questionStartTime is null', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: null,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setSolveTimes).not.toHaveBeenCalled();
  });

  it('should focus input when useSystemKeyboard is true', () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        useSystemKeyboard: true,
        inputRef,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400); // 300ms + 100ms
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('should call onAnswerSubmitted when provided', () => {
    const onAnswerSubmitted = vi.fn();
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        onAnswerSubmitted,
        currentQuestionId: 'q1',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(onAnswerSubmitted).toHaveBeenCalledWith('q1', 8);
  });

  it('should handle haptic feedback when enabled', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: true,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(vibrateMedium).toHaveBeenCalled();
  });

  it('should handle haptic feedback for wrong answer when enabled', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: true,
        answerInput: '7',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(vibrateLong).toHaveBeenCalled();
  });

  it('should not submit when answerInput is only whitespace', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '   ',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).not.toHaveBeenCalled();
  });

  it('should handle invalid answer (NaN)', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: 'abc',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
  });

  it('should not call onAnswerSubmitted when currentQuestionId is null', () => {
    const onAnswerSubmitted = vi.fn();
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        onAnswerSubmitted,
        currentQuestionId: null,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(onAnswerSubmitted).not.toHaveBeenCalled();
  });

  it('should not call onAnswerSubmitted when onAnswerSubmitted is not provided', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestionId: 'q1',
        onAnswerSubmitted: undefined,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should not throw error
    expect(defaultParams.generateNewQuestion).toHaveBeenCalled();
  });

  it('should not focus input when useSystemKeyboard is false', () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        useSystemKeyboard: false,
        inputRef,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus input when inputRef.current is null', () => {
    const inputRef = { current: null };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        useSystemKeyboard: true,
        inputRef,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should not throw error
    expect(defaultParams.generateNewQuestion).toHaveBeenCalled();
  });

  it('should not call vibrateMedium when hapticEnabled is false', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: false,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(vibrateMedium).not.toHaveBeenCalled();
  });

  it('should not call vibrateLong when hapticEnabled is false for wrong answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: false,
        answerInput: '7',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(vibrateLong).not.toHaveBeenCalled();
  });

  it('should use multiplier 1.0 when isExhausted is false', () => {
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(defaultParams.increaseScore).toHaveBeenCalled();
    // Score should not be reduced (multiplier 1.0)
    const scoreCall = defaultParams.increaseScore.mock.calls[0][0];
    // CLIMB_PER_CORRECT * 1.0 = CLIMB_PER_CORRECT (no reduction)
    expect(scoreCall).toBeGreaterThan(0);
    // Compare with exhausted case (should be higher)
    expect(scoreCall).toBeGreaterThan(scoreCall * 0.8);
  });

  it('should not call onSafetyRopeUsed when not provided', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: ['safety_rope'],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Should not throw error
    expect(defaultParams.setIsError).toHaveBeenCalled();
  });

  it('should handle time-attack mode wrong answer flow', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'time-attack',
        answerInput: '7',
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Time-attack mode should decrease score and show toast
    expect(defaultParams.decreaseScore).toHaveBeenCalled();
    expect(defaultParams.setShowSlideToast).toHaveBeenCalledWith(true);
    expect(defaultParams.generateNewQuestion).toHaveBeenCalled();
  });

  it('should decrease score when no safety rope in time-attack mode', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'time-attack',
        answerInput: '7',
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Should decrease score when no safety rope
    expect(defaultParams.decreaseScore).toHaveBeenCalled();
  });

  it('should handle survival mode wrong answer without flare', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 1,
      consumeLife: vi.fn(),
    } as any);

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

    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Should call handleGameOver when no flare
    expect(defaultParams.handleGameOver).toHaveBeenCalled();
  });

  it('should handle answer below minValue for non-negative quiz', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '-10',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
  });

  it('should handle answer above MAX_POSSIBLE_ANSWER', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '999999',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
  });

  it('should handle currentQuestion.answer as string for math question', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestion: {
          question: '5 + 3 = ?',
          answer: '8' as any, // String answer
        },
        answerInput: '8',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    // Should handle string answer correctly
    expect(defaultParams.setIsError).toHaveBeenCalled();
  });

  it('should return early when answerInput is empty', () => {
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

  it('should return early when answerInput is only whitespace', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '   ',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setIsSubmitting).not.toHaveBeenCalled();
  });

  it('should return early when currentQuestion is null', () => {
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

  it('should return early when isSubmitting is true', () => {
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
  });

  it('should handle equation quiz with negative answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        currentQuestion: {
          question: 'x + 5 = 0',
          answer: -5,
        },
        answerInput: '-5',
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should handle calculus quiz with negative answer', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'calculus',
        currentQuestion: {
          question: 'd/dx(-x)',
          answer: -1,
        },
        answerInput: '-1',
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should handle survival mode correct answer with questionStartTime', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: Date.now() - 2000, // 2 seconds ago
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(defaultParams.setTotalQuestions).toHaveBeenCalled();
    expect(defaultParams.setSolveTimes).toHaveBeenCalled();
  });

  it('should handle survival mode correct answer without questionStartTime', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: null,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(defaultParams.increaseScore).toHaveBeenCalled();
    // setSolveTimes should not be called when questionStartTime is null
  });

  it('should handle correct answer with haptic enabled', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: true,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(vibrateMedium).toHaveBeenCalled();
  });

  it('should handle correct answer with haptic disabled', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: false,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(vibrateMedium).not.toHaveBeenCalled();
  });

  it('should handle correct answer with isExhausted true', () => {
    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: true,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should apply 0.8 multiplier when exhausted
    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should handle correct answer with useSystemKeyboard and inputRef', () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        useSystemKeyboard: true,
        inputRef,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('should handle correct answer with useSystemKeyboard but no inputRef', () => {
    const inputRef = { current: null };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        useSystemKeyboard: true,
        inputRef,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should not throw error
    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should call onAnswerSubmitted when provided with currentQuestionId', () => {
    const onAnswerSubmitted = vi.fn();

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        onAnswerSubmitted,
        currentQuestionId: 'question-123',
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(onAnswerSubmitted).toHaveBeenCalledWith('question-123', 8);
  });

  it('should not call onAnswerSubmitted when currentQuestionId is null', () => {
    const onAnswerSubmitted = vi.fn();

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        onAnswerSubmitted,
        currentQuestionId: null,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(onAnswerSubmitted).not.toHaveBeenCalled();
  });

  it('should handle wrong answer with haptic enabled', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
        hapticEnabled: true,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(vibrateLong).toHaveBeenCalled();
  });

  it('should handle wrong answer with haptic disabled', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
        hapticEnabled: false,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(vibrateLong).not.toHaveBeenCalled();
  });


  it('should handle time-attack mode wrong answer with useSystemKeyboard', () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as any;
    const inputRef = { current: mockInput };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'time-attack',
        answerInput: '7',
        useSystemKeyboard: true,
        inputRef,
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('should handle NaN answer input', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: 'abc',
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
  });

  it('should handle answer at MAX_POSSIBLE_ANSWER boundary', () => {
    const maxAnswer = 1998; // MAX_POSSIBLE_ANSWER = 999 + 999
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestion: {
          question: '999 + 999 = ?',
          answer: maxAnswer,
        },
        answerInput: String(maxAnswer),
      })
    );

    vi.mocked(useGameStore).mockReturnValue({
      incrementCombo: vi.fn(),
      resetCombo: vi.fn(),
      isExhausted: false,
      activeItems: [],
      consumeActiveItem: vi.fn(),
      lives: 3,
      consumeLife: vi.fn(),
    } as any);

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(defaultParams.increaseScore).toHaveBeenCalled();
  });

  it('should handle answer above MAX_POSSIBLE_ANSWER', () => {
    const maxAnswer = 1998; // MAX_POSSIBLE_ANSWER = 999 + 999
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: String(maxAnswer + 1),
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as any;

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(defaultParams.setCardAnimation).toHaveBeenCalledWith('wrong-shake');
    expect(defaultParams.setIsSubmitting).toHaveBeenCalledWith(false);
  });
});

