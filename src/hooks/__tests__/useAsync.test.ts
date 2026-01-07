import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const asyncFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn, { immediate: false }));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should execute async function immediately by default', async () => {
    const asyncFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.loading).toBe(true);
    expect(asyncFn).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('data');
    expect(result.current.error).toBeNull();
  });

  it('should handle async function with initial data', () => {
    const asyncFn = vi.fn(() => Promise.resolve('new data'));
    const { result } = renderHook(() =>
      useAsync(asyncFn, { initialData: 'initial', immediate: false })
    );

    expect(result.current.data).toBe('initial');
  });

  it('should handle errors', async () => {
    const error = new Error('Test error');
    const asyncFn = vi.fn(() => Promise.reject(error));
    const { result } = renderHook(() => useAsync(asyncFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const asyncFn = vi.fn(() => Promise.resolve('data'));
    renderHook(() => useAsync(asyncFn, { onSuccess }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('data');
    });
  });

  it('should call onError callback', async () => {
    const error = new Error('Test error');
    const onError = vi.fn();
    const asyncFn = vi.fn(() => Promise.reject(error));
    renderHook(() => useAsync(asyncFn, { onError }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should refetch data', async () => {
    const asyncFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn, { immediate: false }));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });

    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('should set data manually', () => {
    const asyncFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn, { immediate: false }));

    act(() => {
      result.current.setData('manual data');
    });

    expect(result.current.data).toBe('manual data');
  });

  it('should set error manually', () => {
    const asyncFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsync(asyncFn, { immediate: false }));

    act(() => {
      result.current.setError('manual error');
    });

    expect(result.current.error).toBe('manual error');
  });

  it('should not update state after unmount', async () => {
    const asyncFn = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve('data'), 100)));
    const { result, unmount } = renderHook(() => useAsync(asyncFn));

    unmount();

    await new Promise((resolve) => setTimeout(resolve, 200));

    // State should not be updated after unmount
    expect(result.current.data).toBeNull();
  });
});

