import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizSubmit } from '../useQuizSubmit';
import type { QuizQuestion, GameMode } from '../../types/quiz';
import { useGameStore } from '../../../../../stores/useGameStore';
import { CLIMB_PER_CORRECT, MAX_POSSIBLE_ANSWER } from '../../../../../constants/game';
import { quizEventBus } from '../../../../../lib/eventBus';

// Mock dependencies
vi.mock('../../../../../stores/useGameStore', () => ({
  useGameStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({ feverLevel: 0 })),
  }),
}));

vi.mock('../../utils/haptic', () => ({
  vibrateMedium: vi.fn(),
  vibrateLong: vi.fn(),
}));

vi.mock('../../utils/japanese', () => ({
  normalizeRomaji: vi.fn((str: string) => str.toLowerCase().trim()),
}));

vi.mock('../../../../../lib/eventBus', () => ({
  quizEventBus: {
    emit: vi.fn(),
    on: vi.fn(),
  },
}));

// --- Typed Mock Helpers ---

// 1. Mock Event Helper
const createMockEvent = () =>
  ({
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as React.FormEvent;

const defaultGameStoreState = {
  incrementCombo: vi.fn(),
  resetCombo: vi.fn(),
  isExhausted: false,
  activeItems: [],
  consumeActiveItem: vi.fn(),
  lives: 3,
  consumeLife: vi.fn(),
  feverLevel: 0,
} as unknown as ReturnType<typeof useGameStore>;

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
    inputRef: { current: null },
    currentQuestionId: 'q1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T00:00:00Z'));
    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);
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

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should not submit when currentQuestion is null', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestion: null,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should not submit when answerInput is empty', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should handle correct answer for math question', async () => {
    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:SUBMISSION_STARTED');
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
        answer: '8',
        questionId: 'q1',
      })
    );
  });

  it('should handle wrong answer for math question', async () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:SUBMISSION_STARTED');
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
        answer: '7',
      })
    );
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

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:SUBMISSION_STARTED');
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
  });

  it('should handle survival mode wrong answer', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...defaultGameStoreState,
      lives: 1,
    });

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        answerInput: '7',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
        combo: 0,
      })
    );
  });

  it('should record solve time for survival mode correct answer', () => {
    const startTime = Date.now() - 2000;
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: startTime,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        solveTime: expect.any(Number),
      })
    );
  });

  it('should handle safety rope usage on wrong answer', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...defaultGameStoreState,
      activeItems: ['safety_rope'],
    });

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '7',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
      })
    );
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

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:SUBMISSION_STARTED');
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
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

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:SUBMISSION_STARTED');
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
  });

  it('should reject negative answer for regular math question', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '-5',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: '-5',
      })
    );
  });

  it('should reject answer out of range', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '999999',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: '999999',
      })
    );
  });

  it('should handle flare usage in survival mode', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...defaultGameStoreState,
      activeItems: ['flare'],
    });

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        answerInput: '7',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
      })
    );
  });

  it('should apply exhausted multiplier to score', () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...defaultGameStoreState,
      isExhausted: true,
    });

    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        score: 8, // Math.floor(10 * 0.8)
      })
    );
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

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
      })
    );
  });

  it('should not record solve time when questionStartTime is null', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: null,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        solveTime: 0,
      })
    );
  });

  it('should not submit when answerInput is only whitespace', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '   ',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should handle invalid answer (NaN)', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: 'abc',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: 'abc',
      })
    );
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

    const mockEvent = createMockEvent();

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
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    // onAnswerSubmitted is no longer called directly
    expect(quizEventBus.emit).toHaveBeenCalled();
  });

  it('should not focus input when useSystemKeyboard is false', () => {
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as unknown as HTMLInputElement;
    const inputRef = { current: mockInput };

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        useSystemKeyboard: false,
        inputRef,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should handle haptic feedback settings by emitting events', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        hapticEnabled: true,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
  });

  it('should use multiplier 1.0 when isExhausted is false', () => {
    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
        score: 10, // Default score
      })
    );
  });

  it('should emit event for wrong answer in time-attack mode', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'time-attack',
        answerInput: '7',
      })
    );

    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
      })
    );
  });

  it('should handle survival mode wrong answer without flare', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...defaultGameStoreState,
      lives: 1,
    });

    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        answerInput: '7',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: false,
      })
    );
  });

  it('should handle answer below minValue for non-negative quiz', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '-10',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: '-10',
      })
    );
  });

  it('should handle answer above MAX_POSSIBLE_ANSWER', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '999999',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: '999999',
      })
    );
  });
  it('should handle invalid answer format by emitting INVALID_INPUT', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: 'invalid',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: 'invalid',
      })
    );
  });

  it('should handle currentQuestion.answer as string for math question', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestion: {
          question: '5 + 3 = ?',
          answer: '8' as unknown as number, // String answer
        },
        answerInput: '8',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    // Should handle string answer correctly and emit event
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
  });

  it('should return early when answerInput is empty', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should return early when answerInput is only whitespace', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: '   ',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should return early when currentQuestion is null', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        currentQuestion: null,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
  });

  it('should return early when isSubmitting is true', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        isSubmitting: true,
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).not.toHaveBeenCalled();
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

    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
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

    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
  });

  it('should handle survival mode correct answer with questionStartTime', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: Date.now() - 2000, // 2 seconds ago
      })
    );

    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
        solveTime: 2,
      })
    );
  });

  it('should handle survival mode correct answer without questionStartTime', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        gameMode: 'survival',
        questionStartTime: null,
      })
    );

    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
        solveTime: 0,
      })
    );
  });

  it('should handle correct answer with isExhausted true', () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...defaultGameStoreState,
      isExhausted: true,
    });

    const { result } = renderHook(() => useQuizSubmit(defaultParams));

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    // Should apply 0.8 multiplier when exhausted (10 * 0.8 = 8)
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
        score: 8,
      })
    );
  });

  it('should handle NaN answer input', () => {
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: 'abc',
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: 'abc',
      })
    );
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

    vi.mocked(useGameStore).mockReturnValue(defaultGameStoreState);

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:ANSWER_SUBMITTED',
      expect.objectContaining({
        isCorrect: true,
      })
    );
  });

  it('should handle answer above MAX_POSSIBLE_ANSWER', () => {
    const maxAnswer = 1998; // MAX_POSSIBLE_ANSWER = 999 + 999
    const { result } = renderHook(() =>
      useQuizSubmit({
        ...defaultParams,
        answerInput: String(maxAnswer + 1),
      })
    );

    const mockEvent = createMockEvent();

    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:INVALID_INPUT',
      expect.objectContaining({
        answer: String(maxAnswer + 1),
      })
    );
  });
});
