import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sound, audioContextManager } from '../sound';
import { useSettingsStore } from '../../stores/useSettingsStore';

describe('SoundEngine (sound.ts)', () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockFilter: any;
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ soundEnabled: true });

    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockFilter = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      destination: {},
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      createBiquadFilter: vi.fn(() => mockFilter),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Mock window.AudioContext
    (window as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
      return mockAudioContext;
    });
    // Set mock audio context & gain in audioContextManager singleton for test isolation
    (audioContextManager as any).ctx = mockAudioContext;
    (audioContextManager as any).masterGain = mockGain;
  });

  describe('Keypad sounds', () => {
    it('plays normal keypad press', () => {
      sound.playKeypad(false);
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
    });

    it('plays backspace keypad press', () => {
      sound.playKeypad(true);
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
    });
  });

  describe('Quiz feedback sounds', () => {
    it('plays correct answer chime', () => {
      sound.playCorrect();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('plays combo sound with ascending pitch', () => {
      sound.playCombo(3);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('plays wrong buzzer', () => {
      sound.playWrong();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
    });
  });

  describe('Game loop sounds', () => {
    it('plays countdown tick for 3, 2, 1', () => {
      sound.playCountdown(3);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    });

    it('plays start chord for countdown 0 / GO!', () => {
      sound.playCountdown(0);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('plays fever entry sound', () => {
      sound.playFever();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
    });

    it('plays stage clear fanfare', () => {
      sound.playStageClear();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('plays game over jingle', () => {
      sound.playGameOver();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('plays score count micro-tick', () => {
      sound.playScoreCount();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays revive energy sound', () => {
      sound.playRevive();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays stamina warning pulse', () => {
      sound.playStaminaWarning();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('plays tap sound', async () => {
      await new Promise((r) => setTimeout(r, 90));
      sound.playTap();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays back sound', async () => {
      await new Promise((r) => setTimeout(r, 90));
      sound.playBack();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays empty tap sound', async () => {
      await new Promise((r) => setTimeout(r, 90));
      sound.playEmptyTap();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });
  });

  describe('Global tap listener', () => {
    it('plays tap on clicking interactive button outside debug', async () => {
      await new Promise((r) => setTimeout(r, 90));
      const button = document.createElement('button');
      document.body.appendChild(button);

      button.click();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      document.body.removeChild(button);
    });

    it('plays back sound when clicking back/cancel button', async () => {
      await new Promise((r) => setTimeout(r, 90));
      const backButton = document.createElement('button');
      backButton.className = 'header-back-button';
      document.body.appendChild(backButton);

      backButton.click();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      document.body.removeChild(backButton);
    });

    it('plays back sound when clicking game tip back button', async () => {
      await new Promise((r) => setTimeout(r, 90));
      const tipBackButton = document.createElement('button');
      tipBackButton.className = 'gt-checkbox-label back-button';
      tipBackButton.textContent = '← 뒤로';
      document.body.appendChild(tipBackButton);

      tipBackButton.click();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      document.body.removeChild(tipBackButton);
    });

    it('plays empty tap when clicking on empty background', async () => {
      await new Promise((r) => setTimeout(r, 90));
      const div = document.createElement('div');
      div.className = 'empty-background';
      document.body.appendChild(div);

      div.click();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('ignores clicks inside debug container or on keypad keys', async () => {
      await new Promise((r) => setTimeout(r, 90));
      const debugDiv = document.createElement('div');
      debugDiv.className = 'debug-page';
      const debugButton = document.createElement('button');
      debugDiv.appendChild(debugButton);
      document.body.appendChild(debugDiv);

      debugButton.click();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      document.body.removeChild(debugDiv);
    });
  });

  describe('Disabled settings', () => {
    it('does not play sounds when soundEnabled is false', () => {
      useSettingsStore.setState({ soundEnabled: false });
      sound.playCorrect();
      sound.playWrong();
      sound.playKeypad();
      sound.playTap();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });
});
