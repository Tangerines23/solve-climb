import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sound, SoundEngine } from '../soundEngine';
import { audioContextManager } from '../audioContext';
import { playTone, playSweep, playChord, playFilteredTone, playMultiPulse } from '../synthesizers';
import { setupGlobalTapListener } from '../globalTapListener';

vi.mock('../synthesizers', () => ({
  playTone: vi.fn(),
  playSweep: vi.fn(),
  playChord: vi.fn(),
  playFilteredTone: vi.fn(),
  playMultiPulse: vi.fn(),
}));

vi.mock('../audioContext', () => ({
  audioContextManager: {
    isSoundEnabled: vi.fn(),
    getContext: vi.fn(),
    getMasterGain: vi.fn(),
    ensureRunning: vi.fn(),
  },
}));

vi.mock('../globalTapListener', () => ({
  setupGlobalTapListener: vi.fn(() => vi.fn()),
}));

describe('SoundEngine', () => {
  let soundEngine: SoundEngine;
  const mockCtx = {} as AudioContext;
  const mockGain = {} as GainNode;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(audioContextManager.isSoundEnabled).mockReturnValue(true);
    vi.mocked(audioContextManager.getContext).mockReturnValue(mockCtx);
    vi.mocked(audioContextManager.getMasterGain).mockReturnValue(mockGain);
    soundEngine = new SoundEngine();
  });

  afterEach(() => {
    soundEngine.dispose();
  });

  it('instantiates and attaches global tap listeners', () => {
    expect(setupGlobalTapListener).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });

  describe('Audio disabled state', () => {
    beforeEach(() => {
      vi.mocked(audioContextManager.isSoundEnabled).mockReturnValue(false);
    });

    it('does not trigger synthesis when sound is disabled', () => {
      soundEngine.playKeypad();
      soundEngine.playCorrect();
      soundEngine.playCombo(3);
      soundEngine.playWrong();
      soundEngine.playTap();

      expect(playSweep).not.toHaveBeenCalled();
      expect(playChord).not.toHaveBeenCalled();
      expect(playFilteredTone).not.toHaveBeenCalled();
      expect(audioContextManager.ensureRunning).not.toHaveBeenCalled();
    });
  });

  describe('Keypad Sound', () => {
    it('plays normal keypad sweep on input', () => {
      soundEngine.playKeypad(false);
      expect(playSweep).toHaveBeenCalledWith(mockCtx, mockGain, {
        startFreq: 750,
        endFreq: 380,
        duration: 0.03,
        volume: 0.18,
        type: 'sine',
      });
    });

    it('plays lower pitch backspace sweep on backspace', () => {
      soundEngine.playKeypad(true);
      expect(playSweep).toHaveBeenCalledWith(mockCtx, mockGain, {
        startFreq: 440,
        endFreq: 240,
        duration: 0.03,
        volume: 0.18,
        type: 'sine',
      });
    });
  });

  describe('Game Feedback Sounds', () => {
    it('plays correct answer chime chord', () => {
      soundEngine.playCorrect();
      expect(playChord).toHaveBeenCalledWith(
        mockCtx,
        mockGain,
        expect.objectContaining({
          type: 'triangle',
          interval: 0.06,
          defaultDuration: 0.35,
          defaultVolume: 0.2,
        })
      );
    });

    it('plays combo chords with ascending scale degrees', () => {
      soundEngine.playCombo(1);
      expect(playChord).toHaveBeenCalledWith(
        mockCtx,
        mockGain,
        expect.objectContaining({
          type: 'sine',
          notes: [{ freq: 523.25 }, { freq: 587.33 }],
        })
      );

      soundEngine.playCombo(5);
      expect(playChord).toHaveBeenCalledTimes(2);

      // High combo boundary clamp
      soundEngine.playCombo(99);
      expect(playChord).toHaveBeenCalledTimes(3);
    });

    it('plays wrong answer filtered buzzer', () => {
      soundEngine.playWrong();
      expect(playFilteredTone).toHaveBeenCalledWith(mockCtx, mockGain, {
        freq: 160,
        endFreq: 80,
        duration: 0.22,
        volume: 0.24,
        type: 'sawtooth',
        filter: {
          type: 'lowpass',
          frequency: 450,
        },
      });
    });

    it('plays countdown tick for positive numbers and chord on GO (0)', () => {
      soundEngine.playCountdown(3);
      expect(playTone).toHaveBeenCalledWith(mockCtx, mockGain, {
        freq: 880,
        type: 'sine',
        duration: 0.08,
        attack: 0.01,
        volume: 0.2,
      });

      soundEngine.playCountdown(0);
      expect(playChord).toHaveBeenCalledWith(
        mockCtx,
        mockGain,
        expect.objectContaining({
          type: 'triangle',
          defaultVolume: 0.18,
        })
      );
    });

    it('plays fever mode activation sweep', () => {
      soundEngine.playFever();
      expect(playSweep).toHaveBeenCalledWith(mockCtx, mockGain, {
        startFreq: 350,
        endFreq: 1100,
        duration: 0.3,
        attack: 0.1,
        volume: 0.22,
        type: 'sine',
      });
    });

    it('plays stage clear fanfare', () => {
      soundEngine.playStageClear();
      expect(playChord).toHaveBeenCalledWith(
        mockCtx,
        mockGain,
        expect.objectContaining({
          type: 'triangle',
          defaultVolume: 0.22,
        })
      );
    });

    it('plays game over descending notes', () => {
      soundEngine.playGameOver();
      expect(playFilteredTone).toHaveBeenCalledTimes(3);
    });

    it('plays score counting tick', () => {
      soundEngine.playScoreCount();
      expect(playSweep).toHaveBeenCalledWith(mockCtx, mockGain, {
        startFreq: 1600,
        endFreq: 700,
        duration: 0.02,
        volume: 0.12,
        type: 'sine',
      });
    });

    it('plays revive charge sweep', () => {
      soundEngine.playRevive();
      expect(playSweep).toHaveBeenCalledWith(mockCtx, mockGain, {
        startFreq: 220,
        endFreq: 880,
        duration: 0.4,
        attack: 0.15,
        volume: 0.24,
        type: 'triangle',
      });
    });

    it('plays stamina warning heartbeat multi-pulse', () => {
      soundEngine.playStaminaWarning();
      expect(playMultiPulse).toHaveBeenCalledWith(
        mockCtx,
        mockGain,
        expect.arrayContaining([
          expect.objectContaining({ offset: 0, startFreq: 160 }),
          expect.objectContaining({ offset: 0.15, startFreq: 180 }),
        ])
      );
    });
  });

  describe('UI Tap and Throttling', () => {
    it('throttles rapid tap events within 80ms', () => {
      const nowSpy = vi.spyOn(Date, 'now');
      nowSpy.mockReturnValue(1000);

      soundEngine.playTap();
      expect(playSweep).toHaveBeenCalledTimes(1);

      // Call again at 1040ms (within 80ms window) -> throttled
      nowSpy.mockReturnValue(1040);
      soundEngine.playTap();
      expect(playSweep).toHaveBeenCalledTimes(1);

      // Call at 1100ms (100ms > 80ms) -> succeeds
      nowSpy.mockReturnValue(1100);
      soundEngine.playTap();
      expect(playSweep).toHaveBeenCalledTimes(2);

      nowSpy.mockRestore();
    });

    it('throttles rapid back events within 80ms', () => {
      const nowSpy = vi.spyOn(Date, 'now');
      nowSpy.mockReturnValue(1000);

      soundEngine.playBack();
      expect(playSweep).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(1030);
      soundEngine.playBack();
      expect(playSweep).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
    });

    it('plays empty tap sound with lowpass filtered tone and throttles', () => {
      const nowSpy = vi.spyOn(Date, 'now');
      nowSpy.mockReturnValue(1000);

      soundEngine.playEmptyTap();
      expect(playFilteredTone).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(1050);
      soundEngine.playEmptyTap();
      expect(playFilteredTone).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
    });
  });

  describe('Lifecycle and Cleanup', () => {
    it('removes global tap listener on dispose', () => {
      const removeMock = vi.fn();
      vi.mocked(setupGlobalTapListener).mockReturnValueOnce(removeMock);

      const engine = new SoundEngine();
      engine.dispose();
      expect(removeMock).toHaveBeenCalled();
    });

    it('exports singleton sound instance', () => {
      expect(sound).toBeInstanceOf(SoundEngine);
    });
  });
});
