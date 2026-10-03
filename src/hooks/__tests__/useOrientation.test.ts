import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrientation } from '../useOrientation';

describe('useOrientation', () => {
  const originalOrientation = window.screen.orientation;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window.screen, 'orientation', {
      writable: true,
      configurable: true,
      value: originalOrientation,
    });
    window.matchMedia = originalMatchMedia;
  });

  it('detects landscape mode via screen.orientation', () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    Object.defineProperty(window.screen, 'orientation', {
      writable: true,
      configurable: true,
      value: {
        type: 'landscape-primary',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      },
    });

    const { result, unmount } = renderHook(() => useOrientation());
    expect(result.current.isLandscape).toBe(true);
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('detects portrait mode via screen.orientation', () => {
    Object.defineProperty(window.screen, 'orientation', {
      writable: true,
      configurable: true,
      value: {
        type: 'portrait-primary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    const { result } = renderHook(() => useOrientation());
    expect(result.current.isLandscape).toBe(false);
  });

  it('updates isLandscape on orientation change event', () => {
    let changeHandler: (() => void) | null = null;
    const orientationMock = {
      type: 'portrait-primary',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window.screen, 'orientation', {
      writable: true,
      configurable: true,
      value: orientationMock,
    });

    const { result } = renderHook(() => useOrientation());
    expect(result.current.isLandscape).toBe(false);

    act(() => {
      orientationMock.type = 'landscape-primary';
      changeHandler?.();
    });

    expect(result.current.isLandscape).toBe(true);
  });
});
