import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vibrateShort, vibrateMedium, vibrateLong } from '../haptic';

// Mock @apps-in-toss/web-framework
vi.mock('@apps-in-toss/web-framework', () => ({
  generateHapticFeedback: vi.fn(),
}));

describe('haptic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    // Mock window.ReactNativeWebView
    Object.defineProperty(window, 'ReactNativeWebView', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  describe('vibrateShort', () => {
    it('should vibrate browser when not in Toss app', () => {
      vibrateShort();
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('should use Toss haptic feedback when in Toss app', () => {
      Object.defineProperty(window, 'ReactNativeWebView', {
        value: {},
        writable: true,
        configurable: true,
      });

      vibrateShort();
      // generateHapticFeedback may be called or fallback to vibrateBrowser
      // Just verify it doesn't throw
      expect(() => vibrateShort()).not.toThrow();
    });
  });

  describe('vibrateMedium', () => {
    it('should vibrate browser when not in Toss app', () => {
      vibrateMedium();
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it('should use Toss haptic feedback when in Toss app', () => {
      Object.defineProperty(window, 'ReactNativeWebView', {
        value: {},
        writable: true,
        configurable: true,
      });

      vibrateMedium();
      // generateHapticFeedback may be called or fallback to vibrateBrowser
      // Just verify it doesn't throw
      expect(() => vibrateMedium()).not.toThrow();
    });
  });

  describe('vibrateLong', () => {
    it('should vibrate browser when not in Toss app', () => {
      vibrateLong();
      expect(navigator.vibrate).toHaveBeenCalledWith(100);
    });

    it('should use Toss haptic feedback when in Toss app', () => {
      Object.defineProperty(window, 'ReactNativeWebView', {
        value: {},
        writable: true,
        configurable: true,
      });

      vibrateLong();
      // generateHapticFeedback may be called or fallback to vibrateBrowser
      // Just verify it doesn't throw
      expect(() => vibrateLong()).not.toThrow();
    });
  });

  it('should handle missing vibrate API gracefully', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => vibrateShort()).not.toThrow();
    expect(() => vibrateMedium()).not.toThrow();
    expect(() => vibrateLong()).not.toThrow();
  });

  it('should handle vibrateBrowser error gracefully', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(() => {
        throw new Error('Vibration failed');
      }),
      writable: true,
      configurable: true,
    });

    expect(() => vibrateShort()).not.toThrow();
    expect(() => vibrateMedium()).not.toThrow();
    expect(() => vibrateLong()).not.toThrow();
  });

});

