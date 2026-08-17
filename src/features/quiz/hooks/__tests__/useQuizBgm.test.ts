import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuizBgm } from '../useQuizBgm';
import { bgm } from '@/utils/sound';
import { useSettingsStore } from '@/stores/useSettingsStore';

vi.mock('@/utils/sound', () => ({
  bgm: {
    play: vi.fn(),
    stop: vi.fn(),
    getCurrentTheme: vi.fn().mockReturnValue(null),
  },
}));

describe('useQuizBgm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ bgmEnabled: true });
  });

  it('keeps lobby theme (brain_age) playing when showTipModal is true', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'time-attack',
        showTipModal: true,
        showLastChanceModal: false,
        showCountdown: false,
        showPauseModal: false,
      })
    );

    expect(bgm.play).toHaveBeenCalledWith('brain_age');
  });

  it('plays main climbing theme (celeste) in standard level gameplay', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'time-attack',
        showTipModal: false,
        showLastChanceModal: false,
        showCountdown: false,
        showPauseModal: false,
      })
    );

    expect(bgm.play).toHaveBeenCalledWith('celeste');
  });

  it('plays climb theme when isLastSpurtActive is true', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'time-attack',
        showTipModal: false,
        showLastChanceModal: false,
        showCountdown: false,
        showPauseModal: false,
        isLastSpurtActive: true,
      })
    );

    expect(bgm.play).toHaveBeenCalledWith('climb');
  });

  it('plays climb theme in survival mode', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'survival',
        showTipModal: false,
        showLastChanceModal: false,
        showCountdown: false,
        showPauseModal: false,
      })
    );

    expect(bgm.play).toHaveBeenCalledWith('climb');
  });

  it('plays puzzle theme in algebra / advanced mode', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '대수',
        modeParam: 'time-attack',
        showTipModal: false,
        showLastChanceModal: false,
        showCountdown: false,
        showPauseModal: false,
      })
    );

    expect(bgm.play).toHaveBeenCalledWith('puzzle');
  });

  it('stops bgm when showPauseModal is true', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'time-attack',
        showTipModal: false,
        showLastChanceModal: false,
        showCountdown: false,
        showPauseModal: true,
      })
    );

    expect(bgm.stop).toHaveBeenCalledWith(0.15);
  });

  it('stops bgm during countdown', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'time-attack',
        showTipModal: false,
        showLastChanceModal: false,
        showCountdown: true,
        showPauseModal: false,
      })
    );

    expect(bgm.stop).toHaveBeenCalledWith(0.15);
  });

  it('plays crisis theme when showLastChanceModal is true', () => {
    renderHook(() =>
      useQuizBgm({
        categoryParam: '기초',
        modeParam: 'time-attack',
        showTipModal: false,
        showLastChanceModal: true,
        showCountdown: false,
        showPauseModal: false,
      })
    );

    expect(bgm.play).toHaveBeenCalledWith('crisis');
  });
});
