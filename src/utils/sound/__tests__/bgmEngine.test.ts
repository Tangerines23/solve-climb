import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BgmEngine } from '../bgmEngine';
import { audioContextManager } from '../audioContext';

describe('BgmEngine (bgmEngine.ts)', () => {
  let bgmEngine: BgmEngine;
  let mockAudioContext: any;
  let mockGainNode: any;
  let mockOscillatorNode: any;
  let mockFilterNode: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockGainNode = {
      gain: {
        value: 1.0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockFilterNode = {
      type: 'lowpass',
      frequency: {
        value: 20000,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      Q: {
        value: 1.0,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      currentTime: 10,
      state: 'running',
      createOscillator: vi.fn(() => ({ ...mockOscillatorNode })),
      createGain: vi.fn(() => ({ ...mockGainNode })),
      createBiquadFilter: vi.fn(() => ({ ...mockFilterNode })),
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Mock window.AudioContext
    (window as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
      return mockAudioContext;
    });

    (audioContextManager as any).ctx = mockAudioContext;
    (audioContextManager as any).masterGain = mockGainNode;

    bgmEngine = new BgmEngine();
  });

  afterEach(() => {
    bgmEngine.dispose();
    vi.restoreAllMocks();
  });

  it('starts chill ambient theme and schedules nodes', () => {
    bgmEngine.play('chill');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('chill');

    // Advance timer to trigger scheduler loop
    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts arcade chiptune theme and schedules nodes', () => {
    bgmEngine.play('arcade');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('arcade');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts climber pulse theme and schedules nodes', () => {
    bgmEngine.play('climb');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('climb');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts brain age jazz theme and schedules nodes', () => {
    bgmEngine.play('brain_age');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('brain_age');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts celeste climbing theme and schedules nodes', () => {
    bgmEngine.play('celeste');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('celeste');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts cozy shop theme and schedules nodes', () => {
    bgmEngine.play('shop');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('shop');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts summit victory theme and schedules nodes', () => {
    bgmEngine.play('victory');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('victory');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts crisis heartbeat theme and schedules nodes', () => {
    bgmEngine.play('crisis');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('crisis');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('starts quiz puzzle theme and schedules nodes', () => {
    bgmEngine.play('puzzle');

    expect(bgmEngine.isPlaying()).toBe(true);
    expect(bgmEngine.getCurrentTheme()).toBe('puzzle');

    vi.advanceTimersByTime(100);

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('stops bgm and fades out', () => {
    bgmEngine.play('chill');
    expect(bgmEngine.isPlaying()).toBe(true);

    bgmEngine.stop(0.2);
    expect(bgmEngine.isPlaying()).toBe(false);
    expect(bgmEngine.getCurrentTheme()).toBeNull();
  });

  it('adjusts volume within valid range', () => {
    bgmEngine.setVolume(0.8);
    expect(bgmEngine.getVolume()).toBe(0.8);

    bgmEngine.setVolume(1.5);
    expect(bgmEngine.getVolume()).toBe(1.0);

    bgmEngine.setVolume(-0.2);
    expect(bgmEngine.getVolume()).toBe(0);
  });

  it('toggles muffled lowpass filter', () => {
    bgmEngine.play('celeste');
    expect(bgmEngine.getIsMuffled()).toBe(false);

    bgmEngine.setMuffled(true, 0.2);
    expect(bgmEngine.getIsMuffled()).toBe(true);

    bgmEngine.setMuffled(false, 0.2);
    expect(bgmEngine.getIsMuffled()).toBe(false);
  });
});
