import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizInput } from '../useQuizInput';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

describe('useQuizInput', () => {
  const defaultParams = {
    answerInput: '',
    isSubmitting: false,
    isError: false,
    isPaused: false,
    categoryParam: 'math',
    subParam: 'addition',
    setAnswerInput: vi.fn(),
    setDisplayValue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigator.vibrate).mockReturnValue(true);
  });

  it('should return input handlers', () => {
    const { result } = renderHook(() => useQuizInput(defaultParams));

    expect(result.current.handleKeypadNumber).toBeDefined();
    expect(result.current.handleQwertyKeyPress).toBeDefined();
    expect(result.current.handleKeypadClear).toBeDefined();
    expect(result.current.handleKeypadBackspace).toBeDefined();
  });

  it('should handle number input', () => {
    const setAnswerInput = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const newValue = updater('');
        defaultParams.setAnswerInput(newValue);
      } else {
        defaultParams.setAnswerInput(updater);
      }
    });
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalled();
  });

  it('should not handle input when isSubmitting is true', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        isSubmitting: true,
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should not handle input when isError is true', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        isError: true,
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should not handle input when isPaused is true', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        isPaused: true,
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle negative sign for equations', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('-');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalled();
  });

  it('should not allow negative sign for non-equation quizzes', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'addition',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('-');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle clear input', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        answerInput: '123',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadClear();
    });

    expect(setAnswerInput).toHaveBeenCalledWith('');
    expect(setDisplayValue).toHaveBeenCalledWith('');
  });

  it('should handle backspace', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        answerInput: '123',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadBackspace();
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalledWith('');
  });

  it('should handle Japanese quiz input', () => {
    const setAnswerInput = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const newValue = updater('');
        defaultParams.setAnswerInput(newValue);
      } else {
        defaultParams.setAnswerInput(updater);
      }
    });
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'language',
        subParam: 'japanese',
        answerInput: '',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('a');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalled();
  });

  it('should limit input length for math quiz', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        answerInput: '12345', // Max length for non-equation
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('6');
    });

    // Should not add more digits when at max length
    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should call onInputStart callback when provided', () => {
    const onInputStart = vi.fn();
    const setAnswerInput = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        onInputStart,
        setAnswerInput,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(onInputStart).toHaveBeenCalled();
  });
});

