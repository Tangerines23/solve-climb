import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimeout } from '../useTimeout';

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback after delay', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, null));

    vi.advanceTimersByTime(10000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear timeout on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    unmount();
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should update callback when it changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const { rerender } = renderHook(({ callback, delay }) => useTimeout(callback, delay), {
      initialProps: { callback: callback1, delay: 1000 },
    });

    rerender({ callback: callback2, delay: 1000 });

    vi.advanceTimersByTime(1000);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should reset timeout when delay changes', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 1000 },
    });

    vi.advanceTimersByTime(500);

    rerender({ delay: 2000 });

    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

