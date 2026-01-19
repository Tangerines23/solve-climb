import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsStore } from '../useSettingsStore';
import type { KeyboardType } from '../useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useSettingsStore());
    act(() => {
      result.current.setHapticEnabled(true);
      result.current.setKeyboardType('custom');
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSettingsStore());

    expect(result.current.hapticEnabled).toBe(true);
    expect(result.current.keyboardType).toBe('custom');
  });

  it('should set haptic enabled', () => {
    const { result } = renderHook(() => useSettingsStore());

    act(() => {
      result.current.setHapticEnabled(false);
    });

    expect(result.current.hapticEnabled).toBe(false);

    act(() => {
      result.current.setHapticEnabled(true);
    });

    expect(result.current.hapticEnabled).toBe(true);
  });

  it('should set keyboard type', () => {
    const { result } = renderHook(() => useSettingsStore());

    act(() => {
      result.current.setKeyboardType('qwerty');
    });

    expect(result.current.keyboardType).toBe('qwerty');

    act(() => {
      result.current.setKeyboardType('custom');
    });

    expect(result.current.keyboardType).toBe('custom');
  });

  it('should handle all keyboard types', () => {
    const { result } = renderHook(() => useSettingsStore());

    const keyboardTypes: KeyboardType[] = ['custom', 'qwerty'];

    keyboardTypes.forEach((type) => {
      act(() => {
        result.current.setKeyboardType(type);
      });

      expect(result.current.keyboardType).toBe(type);
    });
  });

  it('should persist settings changes', () => {
    const { result } = renderHook(() => useSettingsStore());

    act(() => {
      result.current.setHapticEnabled(false);
      result.current.setKeyboardType('qwerty');
    });

    expect(result.current.hapticEnabled).toBe(false);
    expect(result.current.keyboardType).toBe('qwerty');
  });
});
