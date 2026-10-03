import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  pauseAllAudio,
  resumeAllAudio,
  terminateAllAudio,
  setupAudioLifecycle,
  teardownAudioLifecycle,
} from '../audioLifecycle';
import { audioContextManager } from '../audioContext';
import { bgm } from '../bgmEngine';
import * as haptic from '../../haptic';
import { Capacitor } from '@capacitor/core';

let appStateCallback: ((state: { isActive: boolean }) => void) | null = null;
let pauseCallback: (() => void) | null = null;
let resumeCallback: (() => void) | null = null;

const mockAddListener = vi.fn().mockImplementation((event: string, cb: any) => {
  if (event === 'appStateChange') appStateCallback = cb;
  if (event === 'pause') pauseCallback = cb;
  if (event === 'resume') resumeCallback = cb;
  return Promise.resolve({ remove: vi.fn() });
});

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: any[]) => mockAddListener(...args),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

describe('AudioLifecycle (audioLifecycle.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teardownAudioLifecycle();
    vi.spyOn(bgm, 'pauseForBackground').mockImplementation(() => {});
    vi.spyOn(bgm, 'resumeFromBackground').mockImplementation(() => {});
    vi.spyOn(bgm, 'stopImmediate').mockImplementation(() => {});
    vi.spyOn(audioContextManager, 'suspend').mockResolvedValue(undefined);
    vi.spyOn(audioContextManager, 'resume').mockResolvedValue(undefined);
    vi.spyOn(audioContextManager, 'close').mockResolvedValue(undefined);
    vi.spyOn(haptic, 'stopVibration').mockImplementation(() => {});
  });

  afterEach(() => {
    teardownAudioLifecycle();
    vi.restoreAllMocks();
  });

  describe('Core Lifecycle Handlers', () => {
    it('pauseAllAudio pauses BGM, halts vibration, and suspends AudioContext', async () => {
      await pauseAllAudio();

      expect(haptic.stopVibration).toHaveBeenCalled();
      expect(bgm.pauseForBackground).toHaveBeenCalled();
      expect(audioContextManager.suspend).toHaveBeenCalledWith(true);
    });

    it('resumeAllAudio resumes AudioContext and resumes BGM', async () => {
      await resumeAllAudio();

      expect(audioContextManager.resume).toHaveBeenCalledWith(true);
      expect(bgm.resumeFromBackground).toHaveBeenCalled();
    });

    it('terminateAllAudio immediately halts BGM, stops vibration, and closes AudioContext', async () => {
      await terminateAllAudio();

      expect(haptic.stopVibration).toHaveBeenCalled();
      expect(bgm.stopImmediate).toHaveBeenCalled();
      expect(audioContextManager.close).toHaveBeenCalled();
    });
  });

  describe('Web Standard Event Handling', () => {
    it('handles document.visibilitychange when hidden becomes true and false', async () => {
      setupAudioLifecycle();

      // Simulate document.hidden = true (tab switch or browser minimize)
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      await Promise.resolve();
      expect(haptic.stopVibration).toHaveBeenCalled();
      expect(bgm.pauseForBackground).toHaveBeenCalled();
      expect(audioContextManager.suspend).toHaveBeenCalledWith(true);

      // Simulate document.hidden = false (foreground return)
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      await Promise.resolve();
      expect(audioContextManager.resume).toHaveBeenCalledWith(true);
      expect(bgm.resumeFromBackground).toHaveBeenCalled();
    });

    it('handles window.pagehide and beforeunload by calling terminateAllAudio and stopVibration', async () => {
      setupAudioLifecycle();

      window.dispatchEvent(new Event('pagehide'));
      await Promise.resolve();
      expect(haptic.stopVibration).toHaveBeenCalled();
      expect(bgm.stopImmediate).toHaveBeenCalled();
      expect(audioContextManager.close).toHaveBeenCalled();

      bgm.stopImmediate.mockClear();
      audioContextManager.close.mockClear();
      vi.mocked(haptic.stopVibration).mockClear();

      window.dispatchEvent(new Event('beforeunload'));
      await Promise.resolve();
      expect(haptic.stopVibration).toHaveBeenCalled();
      expect(bgm.stopImmediate).toHaveBeenCalled();
      expect(audioContextManager.close).toHaveBeenCalled();
    });
  });

  describe('Capacitor Native Event Handling', () => {
    it('registers Capacitor app listeners when on native platform and halts vibration on background', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      setupAudioLifecycle();

      // Wait for dynamic import('@capacitor/app')
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 50));

      expect(mockAddListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));
      expect(mockAddListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(mockAddListener).toHaveBeenCalledWith('resume', expect.any(Function));

      // Test appStateChange({ isActive: false })
      if (appStateCallback) {
        vi.mocked(haptic.stopVibration).mockClear();
        (appStateCallback as any)({ isActive: false });
        await Promise.resolve();
        expect(haptic.stopVibration).toHaveBeenCalled();
        expect(bgm.pauseForBackground).toHaveBeenCalled();
      }

      // Test appStateChange({ isActive: true })
      if (appStateCallback) {
        (appStateCallback as any)({ isActive: true });
        await Promise.resolve();
        expect(bgm.resumeFromBackground).toHaveBeenCalled();
      }

      // Test pause event
      if (pauseCallback) {
        vi.mocked(haptic.stopVibration).mockClear();
        (pauseCallback as any)();
        await Promise.resolve();
        expect(haptic.stopVibration).toHaveBeenCalled();
        expect(bgm.pauseForBackground).toHaveBeenCalled();
      }

      // Test resume event
      if (resumeCallback) {
        (resumeCallback as any)();
        await Promise.resolve();
        expect(bgm.resumeFromBackground).toHaveBeenCalled();
      }
    });
  });
});
