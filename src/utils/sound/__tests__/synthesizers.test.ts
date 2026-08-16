import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playTone, playSweep, playChord, playFilteredTone, playMultiPulse } from '../synthesizers';

describe('DSP Synthesizers', () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockFilter: any;
  let mockContext: any;
  let mockDestination: any;

  beforeEach(() => {
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
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockFilter = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      Q: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockContext = {
      currentTime: 10,
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      createBiquadFilter: vi.fn(() => mockFilter),
    };

    mockDestination = {};
  });

  it('playTone generates oscillator with envelope', () => {
    playTone(mockContext, mockDestination, {
      freq: 440,
      type: 'sine',
      duration: 0.2,
      volume: 0.5,
    });

    expect(mockContext.createOscillator).toHaveBeenCalled();
    expect(mockContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 10);
    expect(mockOscillator.start).toHaveBeenCalledWith(10);
    expect(mockOscillator.stop).toHaveBeenCalledWith(10.2);
    expect(mockGain.connect).toHaveBeenCalledWith(mockDestination);
  });

  it('playSweep ramps frequency over duration', () => {
    playSweep(mockContext, mockDestination, {
      startFreq: 300,
      endFreq: 900,
      duration: 0.3,
      exponential: true,
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(300, 10);
    expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(900, 10.3);
  });

  it('playChord creates multiple oscillators for polyphonic sound', () => {
    playChord(mockContext, mockDestination, {
      notes: [{ freq: 523.25 }, { freq: 659.25 }, { freq: 783.99 }],
      type: 'triangle',
      interval: 0.05,
    });

    expect(mockContext.createOscillator).toHaveBeenCalledTimes(3);
    expect(mockContext.createGain).toHaveBeenCalledTimes(3);
  });

  it('playFilteredTone connects oscillator through biquad filter', () => {
    playFilteredTone(mockContext, mockDestination, {
      freq: 200,
      endFreq: 100,
      duration: 0.2,
      type: 'sawtooth',
      filter: {
        type: 'lowpass',
        frequency: 500,
      },
    });

    expect(mockContext.createBiquadFilter).toHaveBeenCalled();
    expect(mockFilter.type).toBe('lowpass');
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockFilter);
    expect(mockFilter.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(mockDestination);
  });

  it('playMultiPulse creates dual-layer pulse nodes', () => {
    playMultiPulse(mockContext, mockDestination, [
      { offset: 0, startFreq: 160, endFreq: 75, punchFreq: 320, dur: 0.12, vol: 0.35 },
      { offset: 0.15, startFreq: 180, endFreq: 85, punchFreq: 380, dur: 0.15, vol: 0.4 },
    ]);

    // 2 beats * 2 oscillators (1 body + 1 punch) = 4
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(4);
    expect(mockContext.createGain).toHaveBeenCalledTimes(4);
  });
});
