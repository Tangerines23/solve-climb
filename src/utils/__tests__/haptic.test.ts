import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vibrateShort, vibrateMedium, vibrateLong } from '../haptic';

describe('haptic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'ReactNativeWebView', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  describe('vibrateShort', () => {
    it('should vibrate browser (10ms)', () => {
      vibrateShort();
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateShort()).not.toThrow();
    });
  });

  describe('vibrateMedium', () => {
    it('should vibrate browser (50ms)', () => {
      vibrateMedium();
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateMedium()).not.toThrow();
    });
  });

  describe('vibrateLong', () => {
    it('should vibrate browser (100ms)', () => {
      vibrateLong();
      expect(navigator.vibrate).toHaveBeenCalledWith(100);
    });

    it('should not throw in any environment', () => {
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

  it('should suppress vibration when document is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    });

    vibrateShort();
    expect(navigator.vibrate).not.toHaveBeenCalled();

    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
  });

  it('should suppress vibration when audioContextManager is in background', async () => {
    const { audioContextManager } = await import('../sound/audioContext');
    await audioContextManager.suspend(true);

    vibrateShort();
    expect(navigator.vibrate).not.toHaveBeenCalled();

    await audioContextManager.resume(true);
  });
});
