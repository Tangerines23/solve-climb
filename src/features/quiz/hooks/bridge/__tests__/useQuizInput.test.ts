import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizInput } from '../useQuizInput';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

describe('useQuizInput', () => {
  const createMocks = (initialInput = '') => {
    let currentInput = initialInput;
    const setAnswerInput = vi.fn((updater) => {
      if (typeof updater === 'function') {
        currentInput = updater(currentInput);
      } else {
        currentInput = updater;
      }
    });
    const setDisplayValue = vi.fn();
    return { setAnswerInput, setDisplayValue, getCurrentInput: () => currentInput };
  };

  const defaultParams = {
    isSubmitting: false,
    isError: false,
    isPaused: false,
    categoryParam: 'math',
    subParam: 'addition',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigator.vibrate).mockReturnValue(true);
  });

  it('should return input handlers', () => {
    const { setAnswerInput, setDisplayValue } = createMocks();
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, setAnswerInput, setDisplayValue })
    );

    expect(result.current.handleKeypadNumber).toBeDefined();
    expect(result.current.handleQwertyKeyPress).toBeDefined();
    expect(result.current.handleKeypadClear).toBeDefined();
    expect(result.current.handleKeypadBackspace).toBeDefined();
  });

  it('should handle number input', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks();
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, setAnswerInput, setDisplayValue })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(getCurrentInput()).toBe('5');
    expect(setDisplayValue).toHaveBeenCalledWith('5');
  });

  it('should not handle input when isSubmitting is true', () => {
    const { setAnswerInput, setDisplayValue } = createMocks();
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, isSubmitting: true, setAnswerInput, setDisplayValue })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should handle negative sign for equations', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks('123');
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

    expect(getCurrentInput()).toBe('-123');
    expect(setDisplayValue).toHaveBeenCalledWith('-123');

    act(() => {
      result.current.handleKeypadNumber('-');
    });
    expect(getCurrentInput()).toBe('123');
  });

  it('should limit input length for math quiz', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks('12345');
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, setAnswerInput, setDisplayValue })
    );

    act(() => {
      result.current.handleKeypadNumber('6');
    });

    expect(getCurrentInput()).toBe('12345');
  });

  it('should handle Japanese quiz input', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks();
    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'language',
        subParam: 'japanese',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('a');
    });

    expect(getCurrentInput()).toBe('a');
    expect(setDisplayValue).toHaveBeenCalledWith('a');
  });

  it('should limit Japanese input to 10 characters', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks('abcdefghij');
    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'language',
        subParam: 'japanese',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('k');
    });

    expect(getCurrentInput()).toBe('abcdefghij');
  });

  it('should handle clear input', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks('123');
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, setAnswerInput, setDisplayValue })
    );

    act(() => {
      result.current.handleKeypadClear();
    });

    expect(getCurrentInput()).toBe('');
  });

  it('should handle backspace', () => {
    const { setAnswerInput, setDisplayValue, getCurrentInput } = createMocks('123');
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, setAnswerInput, setDisplayValue })
    );

    act(() => {
      result.current.handleKeypadBackspace();
    });

    expect(getCurrentInput()).toBe('12');
  });

  it('should call onInputStart callback when provided', () => {
    const onInputStart = vi.fn();
    const { setAnswerInput, setDisplayValue } = createMocks();
    const { result } = renderHook(() =>
      useQuizInput({ ...defaultParams, setAnswerInput, setDisplayValue, onInputStart })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(onInputStart).toHaveBeenCalled();
  });
});
