import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizAnimations } from '../useQuizAnimations';

describe('useQuizAnimations', () => {
  it('should return initial animation states', () => {
    const { result } = renderHook(() => useQuizAnimations());

    expect(result.current.cardAnimation).toBe('');
    expect(result.current.inputAnimation).toBe('');
    expect(result.current.questionAnimation).toBe('fade-in');
    expect(result.current.showFlash).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.showSlideToast).toBe(false);
  });

  it('should update cardAnimation', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setCardAnimation('slide-in');
    });

    expect(result.current.cardAnimation).toBe('slide-in');
  });

  it('should update inputAnimation', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setInputAnimation('shake');
    });

    expect(result.current.inputAnimation).toBe('shake');
  });

  it('should update questionAnimation', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setQuestionAnimation('fade-out');
    });

    expect(result.current.questionAnimation).toBe('fade-out');
  });

  it('should update showFlash', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setShowFlash(true);
    });

    expect(result.current.showFlash).toBe(true);
  });

  it('should update isError', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setIsError(true);
    });

    expect(result.current.isError).toBe(true);
  });

  it('should update showSlideToast', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setShowSlideToast(true);
    });

    expect(result.current.showSlideToast).toBe(true);
  });

  it('should update damagePosition', () => {
    const { result } = renderHook(() => useQuizAnimations());

    act(() => {
      result.current.setDamagePosition({ left: '30%', top: '40%' });
    });

    expect(result.current.damagePosition).toEqual({ left: '30%', top: '40%' });
  });
});

