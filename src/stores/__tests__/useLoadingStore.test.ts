import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingStore } from '../useLoadingStore';

describe('useLoadingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useLoadingStore());
    act(() => {
      result.current.clearAll();
    });
  });

  it('should initialize with empty loadingIds', () => {
    const { result } = renderHook(() => useLoadingStore());

    expect(result.current.isAnyLoading()).toBe(false);
    expect(result.current.isLoading()).toBe(false);
  });

  it('should start loading', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
    });

    expect(result.current.isLoading('loading-1')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('should stop loading', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
      result.current.stopLoading('loading-1');
    });

    expect(result.current.isLoading('loading-1')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('should handle multiple loading IDs', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
      result.current.startLoading('loading-2');
    });

    expect(result.current.isLoading('loading-1')).toBe(true);
    expect(result.current.isLoading('loading-2')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('should stop specific loading without affecting others', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
      result.current.startLoading('loading-2');
      result.current.stopLoading('loading-1');
    });

    expect(result.current.isLoading('loading-1')).toBe(false);
    expect(result.current.isLoading('loading-2')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('should clear all loading', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
      result.current.startLoading('loading-2');
      result.current.clearAll();
    });

    expect(result.current.isLoading('loading-1')).toBe(false);
    expect(result.current.isLoading('loading-2')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('should return true for isLoading() when any loading exists', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
    });

    expect(result.current.isLoading()).toBe(true);
  });

  it('should return false for isLoading() when no loading exists', () => {
    const { result } = renderHook(() => useLoadingStore());

    expect(result.current.isLoading()).toBe(false);
  });

  it('should check specific loading ID', () => {
    const { result } = renderHook(() => useLoadingStore());

    act(() => {
      result.current.startLoading('loading-1');
    });

    expect(result.current.isLoading('loading-1')).toBe(true);
    expect(result.current.isLoading('loading-2')).toBe(false);
  });
});
