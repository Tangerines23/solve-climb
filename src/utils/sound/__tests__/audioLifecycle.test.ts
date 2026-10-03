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
import { Capacitor } from '@capacitor/core';

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
  });

  afterEach(() => {
    teardownAudioLifecycle();
    vi.restoreAllMocks();
  });

  describe('Core Lifecycle Handlers', () => {
    it('pauseAllAudio pauses BGM and suspends AudioContext', async () => {
      await pauseAllAudio();

      expect(bgm.pauseForBackground).toHaveBeenCalled();
      expect(audioContextManager.suspend).toHaveBeenCalledWith(true);
    });

    it('resumeAllAudio resumes AudioContext and resumes BGM', async () => {
      await resumeAllAudio();

      expect(audioContextManager.resume).toHaveBeenCalledWith(true);
      expect(bgm.resumeFromBackground).toHaveBeenCalled();
    });

    it('terminateAllAudio immediately halts BGM and closes AudioContext', async () => {
      await terminateAllAudio();

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
      expect(bgm.pauseForBackground).toHaveBeenCalled();
      expect(audioContextManager.suspend).toHaveBeenCalledWith(true);

      // Simulate document.hidden = false (foreground return)
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      await Promise.resolve();
      expect(audioContextManager.resume).toHaveBeenCalledWith(true);
      expect(bgm.resumeFromBackground).toHaveBeenCalled();
    });

    it('handles window.pagehide and beforeunload by calling terminateAllAudio', async () => {
      setupAudioLifecycle();

      window.dispatchEvent(new Event('pagehide'));
      await Promise.resolve();
      expect(bgm.stopImmediate).toHaveBeenCalled();
      expect(audioContextManager.close).toHaveBeenCalled();

      bgm.stopImmediate.mockClear();
      audioContextManager.close.mockClear();

      window.dispatchEvent(new Event('beforeunload'));
      await Promise.resolve();
      expect(bgm.stopImmediate).toHaveBeenCalled();
      expect(audioContextManager.close).toHaveBeenCalled();
    });
  });

  describe('Capacitor Native Event Handling', () => {
    it('registers Capacitor app listeners when on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      let appStateCallback: ((state: { isActive: boolean }) => void) | null = null;
      let pauseCallback: (() => void) | null = null;
      let resumeCallback: (() => void) | null = null;

      const mockApp = {
        addListener: vi.fn().mockImplementation((event: string, cb: any) => {
          if (event === 'appStateChange') appStateCallback = cb;
          if (event === 'pause') pauseCallback = cb;
          if (event === 'resume') resumeCallback = cb;
          return Promise.resolve({ remove: vi.fn() });
        }),
      };

      vi.doMock('@capacitor/app', () => ({
        App: mockApp,
      }));

      setupAudioLifecycle();

      // Wait a tick for dynamic import('@capacitor/app')
      await new Promise((r) => setTimeout(r, 20));

      expect(mockApp.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));
      expect(mockApp.addListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(mockApp.addListener).toHaveBeenCalledWith('resume', expect.any(Function));

      // Test appStateChange({ isActive: false })
      if (appStateCallback) {
        (appStateCallback as any)({ isActive: false });
        await Promise.resolve();
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
        (pauseCallback as any)();
        await Promise.resolve();
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
