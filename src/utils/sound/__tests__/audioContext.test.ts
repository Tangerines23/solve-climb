import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioContextManager } from '../audioContext';

describe('AudioContextManager (audioContext.ts)', () => {
  let mockAudioContext: any;
  let mockGainNode: any;
  let mockCompressorNode: any;

  beforeEach(() => {
    mockGainNode = {
      gain: { value: 1.0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockCompressorNode = {
      threshold: { setValueAtTime: vi.fn() },
      knee: { setValueAtTime: vi.fn() },
      ratio: { setValueAtTime: vi.fn() },
      attack: { setValueAtTime: vi.fn() },
      release: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10,
      createGain: vi.fn(() => mockGainNode),
      createDynamicsCompressor: vi.fn(() => mockCompressorNode),
      destination: {},
      suspend: vi.fn().mockImplementation(async () => {
        mockAudioContext.state = 'suspended';
      }),
      resume: vi.fn().mockImplementation(async () => {
        mockAudioContext.state = 'running';
      }),
      close: vi.fn().mockImplementation(async () => {
        mockAudioContext.state = 'closed';
      }),
    };

    (window as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
      return mockAudioContext;
    });

    audioContextManager.reset();
  });

  afterEach(() => {
    audioContextManager.reset();
    vi.restoreAllMocks();
  });

  it('initializes context and creates limiter on getContext()', () => {
    const ctx = audioContextManager.getContext();
    expect(ctx).toBe(mockAudioContext);
    expect(audioContextManager.getMasterGain()).toBe(mockGainNode);
    expect(mockCompressorNode.threshold.setValueAtTime).toHaveBeenCalledWith(-1.0, 10);
  });

  describe('Background Suspend & Auto-Resume Prevention', () => {
    it('suspends context and sets isBackground to true', async () => {
      audioContextManager.getContext();
      expect(mockAudioContext.state).toBe('running');

      await audioContextManager.suspend(true);

      expect(mockAudioContext.suspend).toHaveBeenCalled();
      expect(mockAudioContext.state).toBe('suspended');
      expect(audioContextManager.isBackground()).toBe(true);
      expect(audioContextManager.isSuspended()).toBe(true);
    });

    it('prevents getContext() and ensureRunning() from auto-resuming while in background', async () => {
      audioContextManager.getContext();
      await audioContextManager.suspend(true);

      expect(mockAudioContext.state).toBe('suspended');
      mockAudioContext.resume.mockClear();

      // Attempting to getContext while in background should return context but NOT call resume
      const ctx = audioContextManager.getContext();
      expect(ctx).toBe(mockAudioContext);
      expect(mockAudioContext.resume).not.toHaveBeenCalled();

      // Attempting ensureRunning should NOT call resume
      audioContextManager.ensureRunning();
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });

    it('resumes context on resume(true) when already unlocked', async () => {
      audioContextManager.getContext();
      // Simulate user unlock gesture
      window.dispatchEvent(new MouseEvent('click'));

      await audioContextManager.suspend(true);
      expect(audioContextManager.isBackground()).toBe(true);

      mockAudioContext.resume.mockClear();
      await audioContextManager.resume(true);

      expect(audioContextManager.isBackground()).toBe(false);
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('does not force resume context upon user gesture if background suspended', async () => {
      audioContextManager.getContext();
      await audioContextManager.suspend(true);

      mockAudioContext.resume.mockClear();
      // User click while app is in background state
      window.dispatchEvent(new MouseEvent('click'));

      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  describe('Teardown and Close', () => {
    it('closes AudioContext on close() and resets internal references', async () => {
      audioContextManager.getContext();
      expect(audioContextManager.getMasterGain()).not.toBeNull();

      await audioContextManager.close();

      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(audioContextManager.isBackground()).toBe(false);
      expect(audioContextManager.isTerminatedState()).toBe(true);
    });

    it('returns null from getContext() and prevents re-creation when terminated', async () => {
      await audioContextManager.close();
      expect(audioContextManager.isTerminatedState()).toBe(true);

      const ctx = audioContextManager.getContext();
      expect(ctx).toBeNull();
    });

    it('ignores suspend, resume, and gestures when terminated until reset()', async () => {
      await audioContextManager.close();
      mockAudioContext.resume.mockClear();

      await audioContextManager.suspend(true);
      await audioContextManager.resume(true);
      window.dispatchEvent(new MouseEvent('click'));

      expect(mockAudioContext.resume).not.toHaveBeenCalled();

      audioContextManager.reset();
      expect(audioContextManager.isTerminatedState()).toBe(false);
    });
  });
});
