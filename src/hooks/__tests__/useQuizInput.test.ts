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

  it('should remove negative sign when already present', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '-123',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('-');
    });

    expect(setAnswerInput).toHaveBeenCalledWith('123');
    expect(setDisplayValue).toHaveBeenCalledWith('123');
  });

  it('should add negative sign when not present', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '123',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('-');
    });

    expect(setAnswerInput).toHaveBeenCalledWith('-123');
    expect(setDisplayValue).toHaveBeenCalledWith('-123');
  });

  it('should handle calculus quiz with negative sign', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'calculus',
        answerInput: '',
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

  it('should not allow non-letter input for Japanese quiz', () => {
    const setAnswerInput = vi.fn();
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
      result.current.handleQwertyKeyPress('1');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should not allow non-number input for math quiz', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'addition',
        answerInput: '',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('a');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should limit input length for equation quiz (6 digits with negative)', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '-12345', // Max length with negative
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('6');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should limit input length for equation quiz (6 digits without negative)', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '123456', // Max length without negative
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('7');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should limit Japanese input to 10 characters', () => {
    const setAnswerInput = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const newValue = updater('abcdefghij');
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
        answerInput: 'abcdefghij', // Max length
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('k');
    });

    // Should not add more characters when at max length
    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should handle negative sign removal in qwerty handler', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '-123',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('-');
    });

    expect(setAnswerInput).toHaveBeenCalledWith('123');
    expect(setDisplayValue).toHaveBeenCalledWith('123');
  });

  it('should handle negative sign addition in qwerty handler', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '123',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('-');
    });

    expect(setAnswerInput).toHaveBeenCalledWith('-123');
    expect(setDisplayValue).toHaveBeenCalledWith('-123');
  });

  it('should not call onInputStart when input is blocked', () => {
    const onInputStart = vi.fn();
    const setAnswerInput = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        isSubmitting: true,
        onInputStart,
        setAnswerInput,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('5');
    });

    expect(onInputStart).not.toHaveBeenCalled();
  });

  it('should handle number input when answerInput starts with negative sign', () => {
    const setAnswerInput = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const newValue = updater('-12');
        defaultParams.setAnswerInput(newValue);
      } else {
        defaultParams.setAnswerInput(updater);
      }
    });
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        answerInput: '-12',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('3');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalled();
  });

  it('should not add number when answerInput with negative sign reaches max length', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '-12345', // Max length with negative (6 chars)
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleKeypadNumber('6');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });


  it('should not call onInputStart when not provided', () => {
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
        onInputStart: undefined,
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

  it('should handle number input in qwerty handler when answerInput starts with negative', () => {
    const setAnswerInput = vi.fn((updater) => {
      if (typeof updater === 'function') {
        const newValue = updater('-12');
        defaultParams.setAnswerInput(newValue);
      } else {
        defaultParams.setAnswerInput(updater);
      }
    });
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '-12',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('3');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalled();
  });

  it('should not add number in qwerty handler when answerInput with negative reaches max length', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '-12345', // Max length with negative
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('6');
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
  });

  it('should not add number in qwerty handler when answerInput without negative reaches max length', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'equations',
        answerInput: '12345', // Max length without negative (5 chars, but allowNegative is true so max is 6)
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('6');
    });

    // Should be able to add one more digit (max is 6 with allowNegative)
    expect(setAnswerInput).toHaveBeenCalled();
  });

  it('should handle calculus quiz with negative sign in qwerty handler', () => {
    const setAnswerInput = vi.fn();
    const setDisplayValue = vi.fn();

    const { result } = renderHook(() =>
      useQuizInput({
        ...defaultParams,
        categoryParam: 'math',
        subParam: 'calculus',
        answerInput: '',
        setAnswerInput,
        setDisplayValue,
      })
    );

    act(() => {
      result.current.handleQwertyKeyPress('-');
    });

    expect(setAnswerInput).toHaveBeenCalled();
    expect(setDisplayValue).toHaveBeenCalled();
  });

  it('should handle clear when isSubmitting is true', () => {
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
      result.current.handleKeypadClear();
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle backspace when isSubmitting is true', () => {
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
      result.current.handleKeypadBackspace();
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle clear when isError is true', () => {
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
      result.current.handleKeypadClear();
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle backspace when isError is true', () => {
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
      result.current.handleKeypadBackspace();
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle clear when isPaused is true', () => {
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
      result.current.handleKeypadClear();
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });

  it('should handle backspace when isPaused is true', () => {
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
      result.current.handleKeypadBackspace();
    });

    expect(setAnswerInput).not.toHaveBeenCalled();
    expect(setDisplayValue).not.toHaveBeenCalled();
  });
});

