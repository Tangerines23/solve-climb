import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionGenerator } from '../useQuestionGenerator';
import { generateQuestion } from '../../utils/quizGenerator';

import { quizEventBus } from '../../lib/eventBus';

// Mock dependencies
vi.mock('../../utils/quizGenerator', () => ({
  generateQuestion: vi.fn(),
}));

vi.mock('../../lib/eventBus', () => ({
  quizEventBus: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
  },
}));

vi.mock('../../stores/useBaseCampStore', () => ({
  useBaseCampStore: {
    getState: () => ({
      questions: [],
      currentQuestionIndex: 0,
      setCompleted: vi.fn(),
    }),
  },
}));

vi.mock('../../stores/useDeathNoteStore', () => ({
  useDeathNoteStore: {
    getState: () => ({
      getQuestionsByCategory: vi.fn().mockReturnValue([]),
    }),
  },
}));

describe('useQuestionGenerator', () => {
  const defaultParams = {
    category: '기초' as const,
    difficulty: 'easy' as const,
    gameMode: 'time-attack' as const,
    categoryParam: null,
    levelParam: null,
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

  it('should generate question and emit QUIZ:QUESTION_GENERATED event', () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() => useQuestionGenerator(defaultParams));

    act(() => {
      result.current.generateNewQuestion();
    });

    expect(generateQuestion).toHaveBeenCalled();
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:QUESTION_GENERATED',
      expect.objectContaining({
        question: expect.objectContaining({ question: '1 + 1', answer: 2 }),
        questionId: expect.any(String),
      })
    );
  });

  it('should generate arithmetic problem with correct params', () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '2 + 3',
      answer: 5,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: '기초',
        levelParam: 1,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
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

  it('should generate equation with correct params', () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: 'x + 1 = 3',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        categoryParam: '대수',
        levelParam: 1,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
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

  it('should emit event with question data for downstream processing', () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() => useQuestionGenerator(defaultParams));

    act(() => {
      result.current.generateNewQuestion();
    });

    // The hook now emits events instead of calling setters directly
    // Input/display reset and error clearing are handled by useQuizEventProcessor
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:QUESTION_GENERATED',
      expect.objectContaining({
        question: expect.any(Object),
        questionId: expect.any(String),
      })
    );
  });

  it('should generate survival mode questions with sliding window algorithm', () => {
    vi.mocked(generateQuestion).mockReturnValue({
      question: '1 + 1',
      answer: 2,
    });

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        gameMode: 'survival',
        totalQuestions: 10,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    // In survival mode, level is dynamically calculated via sliding window
    // The hook still emits QUIZ:QUESTION_GENERATED
    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:QUESTION_GENERATED',
      expect.objectContaining({
        question: expect.any(Object),
        questionId: expect.any(String),
      })
    );
  });

  it('should handle equations subParam without levelParam', () => {
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

  it('should handle calculus subParam', () => {
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

    expect(generateQuestion).not.toHaveBeenCalled();
    expect(quizEventBus.emit).not.toHaveBeenCalledWith(
      'QUIZ:QUESTION_GENERATED',
      expect.anything()
    );
  });

  it('should subscribe to QUIZ:NEXT_QUESTION_REQUESTED event', () => {
    renderHook(() => useQuestionGenerator(defaultParams));

    expect(quizEventBus.on).toHaveBeenCalledWith(
      'QUIZ:NEXT_QUESTION_REQUESTED',
      expect.any(Function)
    );
  });

  it('should use preGeneratedQuestions when available', () => {
    const preGenQ = {
      question: 'Pre-gen question',
      answer: 42,
      id: 'pre-gen-id',
    };

    const { result } = renderHook(() =>
      useQuestionGenerator({
        ...defaultParams,
        preGeneratedQuestions: [preGenQ as any],
        totalQuestions: 0,
      })
    );

    act(() => {
      result.current.generateNewQuestion();
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith(
      'QUIZ:QUESTION_GENERATED',
      expect.objectContaining({
        question: preGenQ,
        questionId: 'pre-gen-id',
      })
    );
    // Should NOT call generateQuestion since preGeneratedQuestions was used
    expect(generateQuestion).not.toHaveBeenCalled();
  });

  it('should handle arithmetic with different levels', () => {
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

  it('should handle other subParams', () => {
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
