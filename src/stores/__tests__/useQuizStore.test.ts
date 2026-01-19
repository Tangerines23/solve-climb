import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizStore } from '../useQuizStore';
import type { Category, Topic, GameMode, Difficulty, TimeLimit } from '../../types/quiz';

describe('useQuizStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useQuizStore());
    act(() => {
      result.current.resetQuiz();
      result.current.setCategoryTopic(null as any, null as any);
      result.current.setGameMode('time-attack');
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useQuizStore());

    expect(result.current.score).toBe(0);
    expect(result.current.difficulty).toBe('easy');
    expect(result.current.gameMode).toBe('time-attack');
    expect(result.current.category).toBeNull();
    expect(result.current.world).toBeNull();
    expect(result.current.timeLimit).toBe(60);
  });

  it('should increase score', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.increaseScore(10);
    });

    expect(result.current.score).toBe(10);

    act(() => {
      result.current.increaseScore(20);
    });

    expect(result.current.score).toBe(30);
  });

  it('should decrease score', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.increaseScore(50);
      result.current.decreaseScore(20);
    });

    expect(result.current.score).toBe(30);
  });

  it('should not decrease score below zero', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.increaseScore(10);
      result.current.decreaseScore(20);
    });

    expect(result.current.score).toBe(0);
  });

  it('should set difficulty', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.setDifficulty('medium');
    });

    expect(result.current.difficulty).toBe('medium');

    act(() => {
      result.current.setDifficulty('hard');
    });

    expect(result.current.difficulty).toBe('hard');
  });

  it('should set game mode', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.setGameMode('survival');
    });

    expect(result.current.gameMode).toBe('survival');

    act(() => {
      result.current.setGameMode('time-attack');
    });

    expect(result.current.gameMode).toBe('time-attack');
  });

  it('should set category and topic', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.setCategoryTopic('수학', '덧셈');
    });

    expect(result.current.category).toBe('수학');
    expect(result.current.world).toBe('덧셈');
  });

  it('should set time limit', () => {
    const { result } = renderHook(() => useQuizStore());

    const timeLimits: TimeLimit[] = [10, 15, 60, 120, 180];

    timeLimits.forEach((timeLimit) => {
      act(() => {
        result.current.setTimeLimit(timeLimit);
      });

      expect(result.current.timeLimit).toBe(timeLimit);
    });
  });

  it('should reset quiz to initial state', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.increaseScore(100);
      result.current.setDifficulty('hard');
      result.current.setTimeLimit(120);
      result.current.setCategoryTopic('수학', '덧셈');
    });

    act(() => {
      result.current.resetQuiz();
    });

    expect(result.current.score).toBe(0);
    expect(result.current.difficulty).toBe('easy');
    expect(result.current.timeLimit).toBe(60);
    // resetQuiz does not reset category/world
    expect(result.current.category).toBe('수학');
    expect(result.current.world).toBe('덧셈');
  });

  it('should handle multiple score operations', () => {
    const { result } = renderHook(() => useQuizStore());

    act(() => {
      result.current.increaseScore(10);
      result.current.increaseScore(20);
      result.current.decreaseScore(5);
      result.current.increaseScore(15);
    });

    expect(result.current.score).toBe(40);
  });
});
