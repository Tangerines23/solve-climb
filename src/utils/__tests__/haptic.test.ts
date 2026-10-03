import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  vibrateShort,
  vibrateMedium,
  vibrateLong,
  vibrateSuccess,
  vibrateError,
  vibrateCombo,
  stopVibration,
  HAPTIC_DURATION,
  HAPTIC_PATTERN,
} from '../haptic';

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
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
      configurable: true,
    });
  });

  describe('vibrateShort', () => {
    it('should vibrate browser (10ms)', () => {
      vibrateShort();
      expect(navigator.vibrate).toHaveBeenCalledWith(HAPTIC_DURATION.SHORT);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateShort()).not.toThrow();
    });
  });

  describe('vibrateMedium', () => {
    it('should vibrate browser (50ms)', () => {
      vibrateMedium();
      expect(navigator.vibrate).toHaveBeenCalledWith(HAPTIC_DURATION.MEDIUM);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateMedium()).not.toThrow();
    });
  });

  describe('vibrateLong', () => {
    it('should vibrate browser (100ms)', () => {
      vibrateLong();
      expect(navigator.vibrate).toHaveBeenCalledWith(HAPTIC_DURATION.LONG);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateLong()).not.toThrow();
    });
  });

  describe('vibrateSuccess', () => {
    it('should vibrate browser with success pattern [30, 40, 30]', () => {
      vibrateSuccess();
      expect(navigator.vibrate).toHaveBeenCalledWith([...HAPTIC_PATTERN.SUCCESS]);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateSuccess()).not.toThrow();
    });
  });

  describe('vibrateError', () => {
    it('should vibrate browser with error pattern [50, 40, 50]', () => {
      vibrateError();
      expect(navigator.vibrate).toHaveBeenCalledWith([...HAPTIC_PATTERN.ERROR]);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateError()).not.toThrow();
    });
  });

  describe('vibrateCombo', () => {
    it('should vibrate browser with combo pattern [20, 30, 20, 30, 40]', () => {
      vibrateCombo();
      expect(navigator.vibrate).toHaveBeenCalledWith([...HAPTIC_PATTERN.COMBO]);
    });

    it('should not throw in any environment', () => {
      expect(() => vibrateCombo()).not.toThrow();
    });
  });

  describe('stopVibration', () => {
    it('should cancel active vibration by calling navigator.vibrate(0)', () => {
      stopVibration();
      expect(navigator.vibrate).toHaveBeenCalledWith(HAPTIC_DURATION.STOP);
    });

    it('should cancel vibration even when document is hidden (critical for background teardown)', () => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      });

      stopVibration();
      expect(navigator.vibrate).toHaveBeenCalledWith(HAPTIC_DURATION.STOP);

      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });
    });

    it('should handle missing vibrate API or errors gracefully', () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => stopVibration()).not.toThrow();

      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(() => {
          throw new Error('Vibration cancel error');
        }),
        writable: true,
        configurable: true,
      });

      expect(() => stopVibration()).not.toThrow();
    });
  });

  describe('Accessibility & Environmental Guards', () => {
    it('should handle missing vibrate API gracefully across all methods', () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => vibrateShort()).not.toThrow();
      expect(() => vibrateMedium()).not.toThrow();
      expect(() => vibrateLong()).not.toThrow();
      expect(() => vibrateSuccess()).not.toThrow();
      expect(() => vibrateError()).not.toThrow();
      expect(() => vibrateCombo()).not.toThrow();
      expect(() => stopVibration()).not.toThrow();
    });

    it('should handle vibrateBrowser errors gracefully', () => {
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
      expect(() => vibrateSuccess()).not.toThrow();
      expect(() => vibrateError()).not.toThrow();
      expect(() => vibrateCombo()).not.toThrow();
    });

    it('should suppress vibration when document is hidden', () => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      });

      vibrateShort();
      vibrateMedium();
      vibrateSuccess();
      expect(navigator.vibrate).not.toHaveBeenCalled();

      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });
    });

    it('should suppress vibration when prefers-reduced-motion is active', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
        writable: true,
        configurable: true,
      });

      vibrateShort();
      vibrateSuccess();
      vibrateError();
      expect(navigator.vibrate).not.toHaveBeenCalled();
    });

    it('should suppress vibration when audioContextManager is in background', async () => {
      const { audioContextManager } = await import('../sound/audioContext');
      await audioContextManager.suspend(true);

      vibrateShort();
      vibrateSuccess();
      expect(navigator.vibrate).not.toHaveBeenCalled();

      await audioContextManager.resume(true);
    });
  });
});
