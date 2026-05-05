import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizGameState } from '../useQuizGameState';
import type { GameMode } from '../../types/quiz';

describe('useQuizGameState', () => {
  const mockNavigate = vi.fn();
  const defaultParams = {
    score: 100,
    gameMode: 'time-attack' as GameMode,
    mountainParam: 'climb-1',
    worldParam: 'World1',
    categoryParam: 'math',
    subParam: 'addition',
    levelParam: 1,
    modeParam: 'time-attack',
    isExhausted: false,
    navigate: mockNavigate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    expect(result.current.totalQuestions).toBe(0);
    expect(result.current.wrongAnswers).toEqual([]);
    expect(result.current.questionStartTime).toBeNull();
    expect(result.current.solveTimes).toEqual([]);
    expect(result.current.gameSessionId).toBeNull();
    expect(result.current.userAnswers).toEqual([]);
    expect(result.current.questionIds).toEqual([]);
  });

  it('should update totalQuestions', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setTotalQuestions(5);
    });

    expect(result.current.totalQuestions).toBe(5);
  });

  it('should update wrongAnswers', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    const wrongAnswer = {
      question: '5 + 3 = ?',
      wrongAnswer: '7',
      correctAnswer: '8',
    };

    act(() => {
      result.current.setWrongAnswers([wrongAnswer]);
    });

    expect(result.current.wrongAnswers).toEqual([wrongAnswer]);
  });

  it('should update questionStartTime', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    const startTime = Date.now();

    act(() => {
      result.current.setQuestionStartTime(startTime);
    });

    expect(result.current.questionStartTime).toBe(startTime);
  });

  it('should update solveTimes', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setSolveTimes([1.5, 2.0, 3.5]);
    });

    expect(result.current.solveTimes).toEqual([1.5, 2.0, 3.5]);
  });

  it('should update gameSessionId', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setGameSessionId('session-123');
    });

    expect(result.current.gameSessionId).toBe('session-123');
  });

  it('should update userAnswers', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setUserAnswers([1, 2, 3]);
    });

    expect(result.current.userAnswers).toEqual([1, 2, 3]);
  });

  it('should update questionIds', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setQuestionIds(['q1', 'q2', 'q3']);
    });

    expect(result.current.questionIds).toEqual(['q1', 'q2', 'q3']);
  });

  it('should navigate to result page on handleGameOver for time-attack mode', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setTotalQuestions(10);
    });

    // Wait for state update, then call handleGameOver
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    expect(navigateCall).toContain('/result?');

    // Parse query string to check parameters
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);
    expect(params.get('category')).toBe('math');
    expect(params.get('sub')).toBe('addition');
    expect(params.get('level')).toBe('1');
    expect(params.get('mode')).toBe('time-attack');
    expect(params.get('score')).toBe('100');
    expect(params.get('total')).toBe('10');
  });

  it('should include wrong answers in URL for survival mode', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        ...defaultParams,
        gameMode: 'survival',
      })
    );

    const wrongAnswer = {
      question: '5 + 3 = ?',
      wrongAnswer: '7',
      correctAnswer: '8',
    };

    act(() => {
      result.current.setTotalQuestions(5);
      result.current.setWrongAnswers([wrongAnswer]);
      result.current.setSolveTimes([1.5, 2.0]);
    });

    // Wait for state updates, then call handleGameOver
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];

    // Parse query string to check parameters
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);
    expect(params.get('last_q')).toBe('5 + 3 = ?');
    expect(params.get('wrong_a')).toBe('7');
    expect(params.get('correct_a')).toBe('8');
    expect(params.get('wrong_qs')).toBe('5 + 3 = ?');
    expect(params.get('wrong_as')).toBe('7');
    expect(params.get('correct_as')).toBe('8');
    // Average: (1.5 + 2.0) / 2 = 1.75
    expect(params.get('avg_time')).toBe('1.75');
  });

  it('should include session ID and answers in URL when available', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setGameSessionId('session-123');
      result.current.setUserAnswers([8, 10, 12]);
      result.current.setQuestionIds(['q1', 'q2', 'q3']);
    });

    // Wait for state updates, then call handleGameOver
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];

    // Parse query string to check parameters
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);
    expect(params.get('session_id')).toBe('session-123');
    expect(params.get('user_answers')).toBe('[8,10,12]');
    expect(params.get('question_ids')).toBe('["q1","q2","q3"]');
  });

  it('should include exhausted flag when isExhausted is true', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        ...defaultParams,
        isExhausted: true,
      })
    );

    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    expect(navigateCall).toContain('exhausted=true');
  });

  it('should calculate average solve time correctly for survival mode', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        ...defaultParams,
        gameMode: 'survival',
      })
    );

    act(() => {
      result.current.setSolveTimes([1.5, 2.0, 3.5]);
    });

    // Wait for state update, then call handleGameOver
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];

    // Parse query string to check average time
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);
    const avgTime = params.get('avg_time');
    // Average: (1.5 + 2.0 + 3.5) / 3 = 2.33
    expect(avgTime).toBe('2.33');
  });

  it('should handle survival mode without wrong answers', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        ...defaultParams,
        gameMode: 'survival',
      })
    );

    act(() => {
      result.current.setTotalQuestions(5);
      result.current.setWrongAnswers([]);
      result.current.setSolveTimes([1.5, 2.0]);
    });

    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);

    // wrongAnswers가 없으면 last_q, wrong_a, correct_a, wrong_qs, wrong_as, correct_as가 없어야 함
    expect(params.get('last_q')).toBeNull();
    expect(params.get('wrong_a')).toBeNull();
    expect(params.get('correct_a')).toBeNull();
    expect(params.get('wrong_qs')).toBeNull();
    expect(params.get('wrong_as')).toBeNull();
    expect(params.get('correct_as')).toBeNull();
    expect(params.get('avg_time')).toBe('1.75');
  });

  it('should handle survival mode without solveTimes', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        ...defaultParams,
        gameMode: 'survival',
      })
    );

    const wrongAnswer = {
      question: '5 + 3 = ?',
      wrongAnswer: '7',
      correctAnswer: '8',
    };

    act(() => {
      result.current.setTotalQuestions(5);
      result.current.setWrongAnswers([wrongAnswer]);
      result.current.setSolveTimes([]);
    });

    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);

    expect(params.get('last_q')).toBe('5 + 3 = ?');
    expect(params.get('avg_time')).toBeNull();
  });

  it('should handle multiple wrong answers in survival mode', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        ...defaultParams,
        gameMode: 'survival',
      })
    );

    const wrongAnswers = [
      { question: '5 + 3 = ?', wrongAnswer: '7', correctAnswer: '8' },
      { question: '10 - 4 = ?', wrongAnswer: '5', correctAnswer: '6' },
      { question: '2 × 3 = ?', wrongAnswer: '5', correctAnswer: '6' },
    ];

    act(() => {
      result.current.setTotalQuestions(5);
      result.current.setWrongAnswers(wrongAnswers);
    });

    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);

    expect(params.get('last_q')).toBe('2 × 3 = ?');
    expect(params.get('wrong_a')).toBe('5');
    expect(params.get('correct_a')).toBe('6');
    expect(params.get('wrong_qs')).toBe('5 + 3 = ?|10 - 4 = ?|2 × 3 = ?');
    expect(params.get('wrong_as')).toBe('7|5|5');
    expect(params.get('correct_as')).toBe('8|6|6');
  });

  it('should handle null parameters', () => {
    const { result } = renderHook(() =>
      useQuizGameState({
        score: 100,
        gameMode: 'time-attack' as GameMode,
        mountainParam: null,
        worldParam: null,
        categoryParam: null,
        subParam: null,
        levelParam: null,
        modeParam: null,
        isExhausted: false,
        navigate: mockNavigate,
      })
    );

    act(() => {
      result.current.setTotalQuestions(10);
    });

    // 상태 업데이트를 기다린 후 handleGameOver 호출
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);

    expect(params.get('category')).toBeNull();
    expect(params.get('sub')).toBeNull();
    expect(params.get('level')).toBeNull();
    expect(params.get('mode')).toBeNull();
    expect(params.get('score')).toBe('100');
    expect(params.get('total')).toBe('10');
  });

  it('should handle empty arrays for userAnswers and questionIds', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setGameSessionId('session-123');
      result.current.setUserAnswers([]);
      result.current.setQuestionIds([]);
    });

    // 상태 업데이트를 기다린 후 handleGameOver 호출
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);

    expect(params.get('session_id')).toBe('session-123');
    expect(params.get('user_answers')).toBeNull();
    expect(params.get('question_ids')).toBeNull();
  });

  it('should handle null gameSessionId', () => {
    const { result } = renderHook(() => useQuizGameState(defaultParams));

    act(() => {
      result.current.setGameSessionId(null);
      result.current.setUserAnswers([1, 2, 3]);
      result.current.setQuestionIds(['q1', 'q2']);
    });

    // 상태 업데이트를 기다린 후 handleGameOver 호출
    act(() => {
      result.current.handleGameOver();
    });

    expect(mockNavigate).toHaveBeenCalled();
    const navigateCall = mockNavigate.mock.calls[0][0];
    const queryString = navigateCall.split('?')[1];
    const params = new URLSearchParams(queryString);

    expect(params.get('session_id')).toBeNull();
    expect(params.get('user_answers')).toBe('[1,2,3]');
    expect(params.get('question_ids')).toBe('["q1","q2"]');
  });
});
