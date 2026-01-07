import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLoading } from '../useLoading';
import { useLoadingStore } from '../../stores/useLoadingStore';

describe('useLoading', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useLoadingStore());
    act(() => {
      result.current.clearAll();
    });
  });

  it('should return loading state and control functions', () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('start');
    expect(result.current).toHaveProperty('stop');
    expect(result.current).toHaveProperty('execute');
  });

  it('should start and stop loading', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.start();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should use custom ID when provided', () => {
    const { result } = renderHook(() => useLoading({ id: 'custom-id' }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should execute async function with automatic loading management', async () => {
    const { result } = renderHook(() => useLoading());
    const asyncFn = vi.fn(() => Promise.resolve('data'));

    const promise = act(async () => {
      return await result.current.execute(asyncFn);
    });

    const data = await promise;

    expect(data).toBe('data');
    expect(asyncFn).toHaveBeenCalled();
    // Loading should be stopped after execution completes
    expect(result.current.isLoading).toBe(false);
  });

  it('should stop loading even if async function throws', async () => {
    const { result } = renderHook(() => useLoading());
    const asyncFn = vi.fn(() => Promise.reject(new Error('Test error')));

    await expect(result.current.execute(asyncFn)).rejects.toThrow('Test error');

    expect(result.current.isLoading).toBe(false);
  });

  it('should clear loading on unmount', () => {
    const { result, unmount } = renderHook(() => useLoading());

    act(() => {
      result.current.start();
    });

    expect(result.current.isLoading).toBe(true);

    unmount();

    // Loading should be cleared after unmount
    const storeResult = renderHook(() => useLoadingStore());
    expect(storeResult.result.current.isAnyLoading()).toBe(false);
  });
});

